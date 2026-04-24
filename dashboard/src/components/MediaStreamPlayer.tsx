'use client';

import { useEffect, useRef, useState } from 'react';
import { parseBinaryMediaChunk, detectCodecFromInit } from '@/lib/webm-parser';

interface MediaStreamPlayerProps {
    callId: string;
    wsUrl: string;
    token: string;
}

const WAITING_HINT_AFTER_MS = 12000;
/** Keep this many seconds of buffer; remove older data to avoid QuotaExceededError. */
const BUFFER_KEEP_SECONDS = 8;
/** Interval (ms) for proactive buffer trim. */
const BUFFER_TRIM_INTERVAL_MS = 4000;
/** If playback is more than this many seconds behind buffer end, seek to live edge to prevent stall. */
const LIVE_EDGE_SEEK_THRESHOLD_SEC = 4;
const LIVE_EDGE_SEEK_INTERVAL_MS = 2000;
/** Only remove old buffer when we have at least this many seconds ahead (avoids DEMUXER_UNDERFLOW). */
const MIN_BUFFER_AHEAD_BEFORE_TRIM_SEC = 10;


/**
 * Debug logging gated on env. Enable in prod by setting
 *   NEXT_PUBLIC_DEBUG_VIDEO=1
 * in the browser environment. `verror` always runs because it's
 * meant for visible failures (rare + actionable).
 */
const DEBUG_VIDEO =
    process.env.NODE_ENV !== 'production' ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_VIDEO === '1');

function vlog(stage: string, data?: Record<string, unknown>) {
    if (!DEBUG_VIDEO) return;
    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    // eslint-disable-next-line no-console
    console.log(`[VIDEO ${ts}] ${stage}`, data ?? '');
}
function vwarn(stage: string, data?: Record<string, unknown>) {
    if (!DEBUG_VIDEO) return;
    const ts = new Date().toISOString().slice(11, 23);
    // eslint-disable-next-line no-console
    console.warn(`[VIDEO ${ts}] ⚠ ${stage}`, data ?? '');
}
function verror(stage: string, data?: Record<string, unknown>) {
    // Always log real errors — these are rare and indicate a playback failure the user can see.
    const ts = new Date().toISOString().slice(11, 23);
    // eslint-disable-next-line no-console
    console.error(`[VIDEO ${ts}] ✖ ${stage}`, data ?? '');
}

/** Summarize current video + MSE state for logs. */
function snapshotVideo(video: HTMLVideoElement | null, mediaSource: MediaSource | null, sourceBuffer: SourceBuffer | null) {
    if (!video) return { video: 'null' };
    const bufferedRanges: Array<[number, number]> = [];
    try {
        if (sourceBuffer?.buffered) {
            for (let i = 0; i < sourceBuffer.buffered.length; i++) {
                bufferedRanges.push([sourceBuffer.buffered.start(i), sourceBuffer.buffered.end(i)]);
            }
        }
    } catch {}
    const videoBufferedRanges: Array<[number, number]> = [];
    try {
        for (let i = 0; i < video.buffered.length; i++) {
            videoBufferedRanges.push([video.buffered.start(i), video.buffered.end(i)]);
        }
    } catch {}
    return {
        currentTime: +video.currentTime.toFixed(2),
        paused: video.paused,
        ended: video.ended,
        readyState: video.readyState, // 0=NOTHING 1=METADATA 2=CURRENT 3=FUTURE 4=ENOUGH
        networkState: video.networkState, // 0=EMPTY 1=IDLE 2=LOADING 3=NO_SOURCE
        videoError: video.error ? `code=${video.error.code} msg=${video.error.message}` : null,
        msReadyState: mediaSource?.readyState ?? 'null',
        sbUpdating: sourceBuffer?.updating ?? null,
        sbBuffered: bufferedRanges.map(([s, e]) => `${s.toFixed(2)}-${e.toFixed(2)}`).join('|') || '(empty)',
        videoBuffered: videoBufferedRanges.map(([s, e]) => `${s.toFixed(2)}-${e.toFixed(2)}`).join('|') || '(empty)',
    };
}

export function MediaStreamPlayer({ callId, wsUrl, token }: MediaStreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const queueRef = useRef<{ bytes: Uint8Array; isHeader: boolean }[]>([]);
    const hasReceivedChunkRef = useRef(false);
    const hasAppendedInitRef = useRef(false);
    const sourceBufferDeadRef = useRef(false);
    const deferHeaderProcessRef = useRef(false);
    const timestampOffsetRetryCountRef = useRef(0);
    const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const trimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const liveEdgeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const playbackFallbackScheduledRef = useRef(false);
    const appendCountRef = useRef(0);
    const decodeErrorRetryCountRef = useRef(0);
    const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const MAX_DECODE_ERROR_RETRIES = 3;
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showWaitingHint, setShowWaitingHint] = useState(false);
    const [resetCounter, setResetCounter] = useState(0);

    const handleRetry = () => {
        if (autoRetryTimerRef.current) {
            clearTimeout(autoRetryTimerRef.current);
            autoRetryTimerRef.current = null;
        }
        setError(null);
        setIsPlaying(false);
        setShowWaitingHint(false);
        sourceBufferDeadRef.current = false;
        hasReceivedChunkRef.current = false;
        hasAppendedInitRef.current = false;
        queueRef.current = [];
        timestampOffsetRetryCountRef.current = 0;
        playbackFallbackScheduledRef.current = false;
        appendCountRef.current = 0;
        // Manual retry resets the auto-retry budget.
        decodeErrorRetryCountRef.current = 0;
        setResetCounter(c => c + 1);
    };

    // Process the queue when SourceBuffer is ready
    const processQueue = () => {
        if (sourceBufferDeadRef.current) return;
        const sourceBuffer = sourceBufferRef.current;
        const mediaSource = mediaSourceRef.current;
        const video = videoRef.current;
        const queue = queueRef.current;

        if (!sourceBuffer || !mediaSource || sourceBuffer.updating || queue.length === 0) return;
        if (video?.error) {
            verror('video.error in processQueue', { code: video.error.code, msg: video.error.message });
            sourceBufferDeadRef.current = true;

            // Auto-recover from PIPELINE_ERROR_DECODE (code 3): the Chrome decoder
            // hit a bad frame. We give up the current MediaSource and rebuild from
            // the next init segment. Budget is capped so we don't loop forever on
            // a genuinely broken stream — after that, show the manual retry card.
            const isDecodeError = video.error.code === 3;
            if (isDecodeError && decodeErrorRetryCountRef.current < MAX_DECODE_ERROR_RETRIES) {
                decodeErrorRetryCountRef.current++;
                vwarn(`AUTO_RETRY (${decodeErrorRetryCountRef.current}/${MAX_DECODE_ERROR_RETRIES}) after decode error`);
                if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
                autoRetryTimerRef.current = setTimeout(() => {
                    handleRetry();
                }, 1500);
                return;
            }

            setError('Playback error');
            return;
        }

        const item = queue.shift();
        if (!item) return;
        const { bytes, isHeader } = item;
        if (bytes.length === 0) { processQueue(); return; }

        // Skip clearly invalid chunks (too small)
        if (bytes.length < 2) {
            processQueue();
            return;
        }

        // Wait for first init segment before appending data
        if (!isHeader && !hasAppendedInitRef.current) {
            return; // Drop data before header
        }

        try {
            if (isHeader && !hasAppendedInitRef.current) {
                // FIRST header: detect codec and switch SourceBuffer if needed
                const detectedCodec = detectCodecFromInit(bytes);
                const currentMime = (sourceBuffer as any).mimeType || '';
                const needsSwitch = (detectedCodec === 'vp8' && currentMime.includes('vp9')) ||
                                    (detectedCodec === 'vp9' && currentMime.includes('vp8'));
                if (needsSwitch && mediaSource.readyState === 'open') {
                    const newMime = `video/webm;codecs=${detectedCodec},opus`;
                    vwarn('CODEC_MISMATCH_SWITCH', { from: currentMime, to: newMime });
                    try {
                        mediaSource.removeSourceBuffer(sourceBuffer);
                        const newSB = mediaSource.addSourceBuffer(newMime);
                        (newSB as any).mimeType = newMime;
                        sourceBufferRef.current = newSB;
                        newSB.mode = 'sequence';
                        newSB.addEventListener('updateend', () => processQueue());
                        newSB.addEventListener('error', () => {
                            sourceBufferDeadRef.current = true;
                            sourceBufferRef.current = null;
                            setError('Playback error');
                        });
                        // Re-queue this header for the new SourceBuffer, then force re-processing
                        // on next tick so the header is appended to the NEW SourceBuffer.
                        // Without this setTimeout the queue stalls: data chunks keep arriving
                        // but are rejected (no init yet), so processQueue is never re-invoked
                        // and the re-queued header sits there forever.
                        queueRef.current.unshift(item!);
                        setTimeout(() => processQueue(), 0);
                        return;
                    } catch (switchErr) {
                        vwarn('CODEC_SWITCH_FAILED', { err: String(switchErr) });
                    }
                }
                hasAppendedInitRef.current = true;
                vlog('INIT_APPENDED', { size: bytes.byteLength, codec: detectedCodec });
            } else if (isHeader && hasAppendedInitRef.current) {
                // Detect a fresh EBML init segment (starts with 0x1A 0x45 0xDF 0xA3).
                // The MediaRecorder in the seller re-emits a new init segment every few seconds
                // when it resets. In MSE 'segments' mode we APPEND it so the WebM demuxer
                // reinitializes for the new Segment; otherwise the next data chunks (which belong
                // to the new segment) fail with "RunSegmentParserLoop: stream parsing failed".
                const looksLikeEBML = bytes.length > 64
                    && bytes[0] === 0x1a && bytes[1] === 0x45
                    && bytes[2] === 0xdf && bytes[3] === 0xa3;
                if (looksLikeEBML) {
                    vlog('NEW_SEGMENT_INIT_APPEND', { size: bytes.byteLength });
                    // Fall through to appendBuffer — MSE will re-init the parser
                } else if (bytes.length < 8) {
                    // tiny heartbeat/control chunk — ignore
                    processQueue();
                    return;
                } else {
                    // Mislabelled header that is not a real init segment — treat as data
                }
            }

            const bufBefore = sourceBuffer.buffered.length > 0
                ? `${sourceBuffer.buffered.start(0).toFixed(2)}-${sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1).toFixed(2)}`
                : '(empty)';
            const copy = new Uint8Array(bytes.byteLength);
            copy.set(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
            try {
                sourceBuffer.appendBuffer(copy.buffer);
                appendCountRef.current++;
                // Log every 5th append so we can see what's flowing into the SourceBuffer
                if (appendCountRef.current <= 3 || appendCountRef.current % 5 === 0) {
                    vlog('APPEND_CALLED', { seq: appendCountRef.current, size: bytes.byteLength, isHeader, bufBefore });
                }
            } catch (appendErr) {
                vwarn('APPEND_SYNC_THROW', { msg: String(appendErr), size: bytes.byteLength, isHeader });
                throw appendErr;
            }

            // Try to play
            if (video?.paused && video.readyState >= 2 && !video.error) {
                video.play().catch(() => {});
            }
            if (video && !playbackFallbackScheduledRef.current && hasAppendedInitRef.current) {
                playbackFallbackScheduledRef.current = true;
                setTimeout(() => {
                    const v = videoRef.current;
                    if (v && (v.readyState >= 2 || v.currentTime > 0)) {
                        if (v.paused) v.play().catch(() => {});
                        setIsPlaying(true);
                    }
                }, 2000);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            vwarn('appendBuffer_ERROR', { msg, ...snapshotVideo(video, mediaSource, sourceBuffer) });

            if (msg.includes('removed from the parent') || msg.includes('error attribute')) {
                sourceBufferDeadRef.current = true;
                sourceBufferRef.current = null;
                setError('Playback error');
                return;
            }
            if (msg.includes('QuotaExceeded') || msg.includes('QUOTA_EXCEEDED')) {
                queue.unshift(item);
                try {
                    const ct = video?.currentTime ?? 0;
                    const end = Math.max(0, ct - BUFFER_KEEP_SECONDS);
                    if (sourceBuffer.buffered.length > 0 && end > 0) {
                        sourceBuffer.remove(0, end);
                    } else {
                        setTimeout(processQueue, 300);
                    }
                } catch {
                    setTimeout(processQueue, 500);
                }
                return;
            }
            // For other errors (PARSING_MEDIA_SEGMENT etc), just skip the chunk and continue
            setTimeout(processQueue, 100);
        }
    };

    useEffect(() => {
        if (!videoRef.current) return;

        const instanceId = `MSP-${Math.random().toString(36).slice(2, 8)}`;
        vlog('MOUNT', { instanceId, callId, resetCounter });

        queueRef.current = [];
        hasReceivedChunkRef.current = false;
        hasAppendedInitRef.current = false;
        sourceBufferDeadRef.current = false;
        deferHeaderProcessRef.current = false;
        timestampOffsetRetryCountRef.current = 0;
        playbackFallbackScheduledRef.current = false;
        appendCountRef.current = 0;
        setError(null);
        setIsPlaying(false);
        setShowWaitingHint(false);

        // Chunk arrival stats
        const chunkStats = { totalChunks: 0, totalBytes: 0, headers: 0, dataChunks: 0, lastLogAt: Date.now() };

        waitingTimeoutRef.current = setTimeout(() => {
            setShowWaitingHint(true);
            vwarn('NO_CHUNK_TIMEOUT_12S', { callId, chunksReceived: chunkStats.totalChunks });
        }, WAITING_HINT_AFTER_MS);

        // Video element listeners for diagnostics
        const videoEl = videoRef.current;
        const onVideoEvent = (evName: string) => () => {
            vlog(`video.${evName}`, snapshotVideo(videoEl, mediaSourceRef.current, sourceBufferRef.current));
        };
        const videoEvents = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'pause', 'waiting', 'stalled', 'suspend', 'emptied', 'error', 'ended'];
        const videoListeners = videoEvents.map(ev => {
            const fn = onVideoEvent(ev);
            videoEl.addEventListener(ev, fn);
            return { ev, fn };
        });

        // Health check every 2s — single-line format so you can scan/copy without expanding.
        // Skipped entirely when debug logging is disabled to avoid per-tick work in prod.
        const healthCheck = DEBUG_VIDEO ? setInterval(() => {
            const snap = snapshotVideo(videoEl, mediaSourceRef.current, sourceBufferRef.current);
            const wsState = wsRef.current?.readyState;
            const wsLabel = wsState === 0 ? 'CONNECTING' : wsState === 1 ? 'OPEN' : wsState === 2 ? 'CLOSING' : wsState === 3 ? 'CLOSED' : '?';
            // eslint-disable-next-line no-console
            console.log(
                `[VIDEO HEALTH] t=${snap.currentTime} rs=${snap.readyState} ns=${snap.networkState} ` +
                `paused=${snap.paused} err=${snap.videoError ?? 'null'} ` +
                `chunks=${chunkStats.totalChunks}(data=${chunkStats.dataChunks},hdr=${chunkStats.headers},${Math.round(chunkStats.totalBytes / 1024)}KB) ` +
                `queue=${queueRef.current.length} sbUpd=${snap.sbUpdating} msRS=${snap.msReadyState} ` +
                `sbBuf=${snap.sbBuffered} vBuf=${snap.videoBuffered} ws=${wsLabel} ` +
                `dead=${sourceBufferDeadRef.current} err=${error ?? 'null'}`
            );
        }, 2000) : null;

        // Create MediaSource
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        videoRef.current.src = URL.createObjectURL(mediaSource);
        vlog('MediaSource_created', { readyState: mediaSource.readyState });

        const handleSourceOpen = () => {
            URL.revokeObjectURL(videoRef.current!.src); // Cleanup URL

            const videoEl = videoRef.current;
            if (videoEl) {
                videoEl.addEventListener('playing', () => setIsPlaying(true), { once: true });
                videoEl.addEventListener('canplay', () => setIsPlaying(true), { once: true });
            }

            try {
                // vp9 first — Google Meet's default codec since 2020+.
                // Starting with vp9 avoids an unnecessary codec switch on the very first header.
                const webmTypes = [
                    'video/webm;codecs=vp9,opus',
                    'video/webm;codecs=opus,vp9',
                    'video/webm;codecs=vp8,opus',
                    'video/webm;codecs=opus,vp8',
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8',
                    'video/webm;codecs=vp8,vorbis',
                    'video/webm',
                ];
                const mimeType = webmTypes.find((t) => MediaSource.isTypeSupported(t)) ?? webmTypes[0];
                vlog('SB_ADD', { mimeType });

                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                (sourceBuffer as any).mimeType = mimeType; // store for codec detection
                sourceBufferRef.current = sourceBuffer;
                sourceBuffer.mode = 'sequence';

                sourceBuffer.addEventListener('updateend', () => {
                    processQueue();
                });

                sourceBuffer.addEventListener('error', (e) => {
                    vwarn('SB_ERROR — attempting recovery', { event: String(e), ...snapshotVideo(videoEl, mediaSourceRef.current, sourceBuffer) });
                    sourceBufferDeadRef.current = true;
                    sourceBufferRef.current = null;
                    try {
                        if (mediaSource.readyState === 'open') mediaSource.endOfStream();
                    } catch (_) { /* ignore */ }

                    // Auto-recover: recreate MediaSource after brief pause
                    setTimeout(() => {
                        if (!videoRef.current) return;
                        vlog('RECREATING_MEDIASOURCE_AFTER_ERROR');
                        sourceBufferDeadRef.current = false;
                        hasAppendedInitRef.current = false;
                        queueRef.current = [];
                        setError(null);

                        const newMS = new MediaSource();
                        mediaSourceRef.current = newMS;
                        videoRef.current!.src = URL.createObjectURL(newMS);
                        newMS.addEventListener('sourceopen', () => {
                            URL.revokeObjectURL(videoRef.current!.src);
                            try {
                                const webmTypes = [
                                    'video/webm;codecs=opus,vp9',
                                    'video/webm;codecs=vp9,opus',
                                    'video/webm;codecs=opus,vp8',
                                    'video/webm;codecs=vp8,opus',
                                    'video/webm;codecs=vp8,vorbis',
                                    'video/webm;codecs=vp9',
                                    'video/webm;codecs=vp8'
                                ];
                                const mimeType = webmTypes.find((t) => MediaSource.isTypeSupported(t)) ?? webmTypes[0];
                                const newSB = newMS.addSourceBuffer(mimeType);
                                sourceBufferRef.current = newSB;
                                newSB.mode = 'sequence';
                                newSB.addEventListener('updateend', () => processQueue());
                                newSB.addEventListener('error', () => {
                                    sourceBufferDeadRef.current = true;
                                    sourceBufferRef.current = null;
                                    setError('Playback error');
                                });
                            } catch (e) {
                                setError('Playback error');
                            }
                        });
                    }, 1500);
                });

                trimIntervalRef.current = setInterval(() => {
                    if (sourceBufferDeadRef.current) return;
                    const sb = sourceBufferRef.current;
                    const v = videoRef.current;
                    if (!sb || !v || sb.updating) return;
                    const buffered = sb.buffered;
                    if (buffered.length === 0) return;
                    const ct = v.currentTime;
                    const bufferEnd = buffered.end(buffered.length - 1);
                    if (ct <= BUFFER_KEEP_SECONDS) return;
                    if (bufferEnd - ct < MIN_BUFFER_AHEAD_BEFORE_TRIM_SEC) return;
                    const end = Math.max(0, ct - BUFFER_KEEP_SECONDS);
                    try {
                        sb.remove(0, end);
                    } catch {
                        // ignore
                    }
                }, BUFFER_TRIM_INTERVAL_MS);

                liveEdgeIntervalRef.current = setInterval(() => {
                    if (sourceBufferDeadRef.current) return;
                    const sb = sourceBufferRef.current;
                    const v = videoRef.current;
                    if (!sb || !v || v.paused) return;
                    const buffered = sb.buffered;
                    if (buffered.length === 0) return;
                    const bufferEnd = buffered.end(buffered.length - 1);
                    const ct = v.currentTime;
                    if (bufferEnd - ct > LIVE_EDGE_SEEK_THRESHOLD_SEC) {
                        const target = Math.max(ct, bufferEnd - 2);
                        if (target > ct + 0.5) {
                            v.currentTime = target;
                        }
                    }
                }, LIVE_EDGE_SEEK_INTERVAL_MS);

                const ws = new WebSocket(wsUrl);
                ws.binaryType = 'arraybuffer';
                wsRef.current = ws;

                let wsAuthenticated = false;
                ws.onopen = () => {
                    vlog('WS_OPEN → sending auth', { tokenLen: token?.length ?? 0 });
                    ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
                };

                ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
                    const data = event.data;

                    if (data instanceof ArrayBuffer) {
                        const parsed = parseBinaryMediaChunk(data);
                        if (!parsed) return;
                        const { bytes, isHeader } = parsed;
                        chunkStats.totalChunks++;
                        chunkStats.totalBytes += bytes.length;
                        if (isHeader) chunkStats.headers++; else chunkStats.dataChunks++;
                        if (!hasReceivedChunkRef.current) {
                            hasReceivedChunkRef.current = true;
                            vlog('FIRST_CHUNK_RX', { instanceId, isHeader, bytes: bytes.length });
                        }
                        // Log every header so we can see if they are real (1KB+) or garbage (1 byte)
                        if (isHeader) {
                            vlog('HEADER_RX', { seq: chunkStats.headers, bytes: bytes.length, first8: Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ') });
                        }
                        // Log every Nth data chunk so we can see data is flowing after init
                        if (hasAppendedInitRef.current && !isHeader && chunkStats.dataChunks % 25 === 0) {
                            vlog('DATA_FLOW', { instanceId, dataChunks: chunkStats.dataChunks, chunkSize: bytes.length });
                        }
                        if (!hasAppendedInitRef.current) {
                            if (!isHeader) {
                                if (chunkStats.dataChunks <= 20 || chunkStats.dataChunks % 20 === 0) {
                                    vwarn('DATA_CHUNK_BEFORE_INIT', { instanceId, bytesDropped: bytes.length, totalDropped: chunkStats.dataChunks });
                                }
                                return;
                            }
                        }
                        if (waitingTimeoutRef.current) {
                            clearTimeout(waitingTimeoutRef.current);
                            waitingTimeoutRef.current = null;
                        }
                        queueRef.current.push({ bytes, isHeader });
                        processQueue();
                        setShowWaitingHint(false);
                        if (queueRef.current.length >= 1 && !sourceBufferDeadRef.current && videoRef.current?.paused) {
                            videoRef.current.play().catch((e) => { vwarn('video.play.rejected', { msg: String(e) }); });
                        }
                        return;
                    }

                    try {
                        const message = JSON.parse(data as string);
                        if (message.type === 'auth:ok' && !wsAuthenticated) {
                            wsAuthenticated = true;
                            vlog('WS_AUTH_OK → manager:join', { callId });
                            ws.send(JSON.stringify({
                                type: 'manager:join',
                                payload: { callId }
                            }));
                            return;
                        }
                        if (message.type === 'manager:joined') {
                            vlog('WS_MANAGER_JOINED', { callId: message.payload?.callId });
                            return;
                        }
                        vlog('WS_MSG_UNKNOWN', { type: message.type, payload: message.payload });
                    } catch {
                        if (!hasReceivedChunkRef.current) setError('Invalid stream data');
                    }
                };

                let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
                let reconnectAttempt = 0;
                const MAX_RECONNECT_DELAY = 10000;

                const reconnectWS = () => {
                    if (reconnectTimer) return;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY);
                    reconnectAttempt++;
                    vwarn(`WS_RECONNECTING in ${delay}ms (attempt ${reconnectAttempt})`);
                    reconnectTimer = setTimeout(() => {
                        reconnectTimer = null;
                        if (!wsRef.current || wsRef.current.readyState >= WebSocket.CLOSING) {
                            const newWs = new WebSocket(wsUrl);
                            newWs.binaryType = 'arraybuffer';
                            wsRef.current = newWs;
                            newWs.onopen = ws.onopen;
                            newWs.onmessage = ws.onmessage;
                            newWs.onerror = ws.onerror;
                            newWs.onclose = ws.onclose;
                        }
                    }, delay);
                };

                ws.onerror = (e) => {
                    vwarn('WS_ERROR', { readyState: ws.readyState, msg: String(e) });
                };

                ws.onclose = (ev) => {
                    vwarn('WS_CLOSE', { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
                    setIsPlaying(false);
                    reconnectWS();
                };

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Playback error';
                verror('handleSourceOpen_CAUGHT', { msg: message });
                setError(message);
            }
        };

        mediaSource.addEventListener('sourceopen', handleSourceOpen);

        return () => {
            vlog('UNMOUNT_OR_DEP_CHANGE', { totalChunks: chunkStats.totalChunks, totalKB: Math.round(chunkStats.totalBytes / 1024) });
            if (healthCheck) clearInterval(healthCheck);
            if (autoRetryTimerRef.current) {
                clearTimeout(autoRetryTimerRef.current);
                autoRetryTimerRef.current = null;
            }
            videoListeners.forEach(({ ev, fn }) => {
                try { videoEl.removeEventListener(ev, fn); } catch {}
            });
            if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
            if (trimIntervalRef.current) {
                clearInterval(trimIntervalRef.current);
                trimIntervalRef.current = null;
            }
            if (liveEdgeIntervalRef.current) {
                clearInterval(liveEdgeIntervalRef.current);
                liveEdgeIntervalRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (sourceBufferRef.current) {
                try {
                    sourceBufferRef.current.removeEventListener('updateend', processQueue);
                } catch (e) { }
            }
            if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                try {
                    mediaSourceRef.current.endOfStream();
                } catch (e) { }
            }
            mediaSource.removeEventListener('sourceopen', handleSourceOpen);
        };
    }, [callId, wsUrl, token, resetCounter]);

    return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden border border-gray-800 shadow-xl aspect-video">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 backdrop-blur-sm">
                    <div className="text-center px-6 py-5 rounded-xl bg-red-900/30 border border-red-500/30 max-w-sm">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-white font-semibold mb-1">{error}</p>
                        <p className="text-xs text-gray-400 mb-3">
                            O player do vídeo ao vivo encontrou um problema. Isso pode acontecer ao trocar de codec ou após instabilidade na rede.
                        </p>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            )}

            {!isPlaying && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 backdrop-blur-sm">
                    <div className="text-white text-center px-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto mb-3" />
                        <p className="text-gray-300 text-sm font-medium animate-pulse">
                            {showWaitingHint
                                ? 'Aguardando transmissão. Peça ao vendedor para clicar em Iniciar na extensão (aba do Meet).'
                                : 'Conectando ao feed ao vivo...'}
                        </p>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
            />

            {isPlaying && (
                <div className="absolute top-3 right-3 bg-red-600/90 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse z-20">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    LIVE
                </div>
            )}
        </div>
    );
}
