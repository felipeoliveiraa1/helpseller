'use client';

import { useEffect, useRef, useState } from 'react';

interface MediaStreamPlayerProps {
    callId: string;
    wsUrl: string;
    token: string;
}

const WAITING_HINT_AFTER_MS = 12000;

const WEBM_EBML = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);

function isWebMInit(bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;
    return bytes[0] === WEBM_EBML[0] && bytes[1] === WEBM_EBML[1] && bytes[2] === WEBM_EBML[2] && bytes[3] === WEBM_EBML[3];
}

/** Binary frame from backend: 1 byte flag (0x01=header, 0x00=data) + chunk bytes. */
function parseBinaryMediaChunk(data: ArrayBuffer): { bytes: Uint8Array; isHeader: boolean } | null {
    if (data.byteLength < 2) return null;
    const view = new Uint8Array(data);
    const isHeader = view[0] === 0x01;
    const chunkLen = view.length - 1;
    const chunk = new Uint8Array(chunkLen);
    for (let i = 0; i < chunkLen; i++) chunk[i] = view[i + 1];
    return { bytes: chunk, isHeader };
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
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showWaitingHint, setShowWaitingHint] = useState(false);

    // Process the queue when SourceBuffer is ready
    const processQueue = () => {
        if (sourceBufferDeadRef.current) return;
        const sourceBuffer = sourceBufferRef.current;
        const mediaSource = mediaSourceRef.current;
        const video = videoRef.current;
        const queue = queueRef.current;

        if (!sourceBuffer || !mediaSource || sourceBuffer.updating || queue.length === 0) return;
        if (video?.error) {
            sourceBufferDeadRef.current = true;
            setError('Playback error');
            return;
        }

        const item = queue.shift();
        if (!item) return;
        const { bytes, isHeader } = item;
        if (bytes.length === 0) return;

        const DEFER_HEADER_MS = 150;
        const RETRY_PARSING_MS = 200;

        if (isHeader && hasAppendedInitRef.current) {
            if (!deferHeaderProcessRef.current) {
                queue.unshift(item);
                deferHeaderProcessRef.current = true;
                setTimeout(() => {
                    deferHeaderProcessRef.current = true;
                    processQueue();
                }, DEFER_HEADER_MS);
                return;
            }
            deferHeaderProcessRef.current = false;
        }

        try {
            if (isHeader && hasAppendedInitRef.current) {
                const duration = mediaSource.duration;
                const offset = Number.isFinite(duration) && duration >= 0 ? duration : 0;
                try {
                    sourceBuffer.timestampOffset = offset;
                    timestampOffsetRetryCountRef.current = 0;
                } catch (offsetErr: unknown) {
                    const offsetMsg = offsetErr instanceof Error ? offsetErr.message : String(offsetErr);
                    if (offsetMsg.includes('PARSING_MEDIA_SEGMENT') && timestampOffsetRetryCountRef.current < 15) {
                        timestampOffsetRetryCountRef.current += 1;
                        queue.unshift(item);
                        setTimeout(processQueue, RETRY_PARSING_MS);
                        return;
                    }
                    timestampOffsetRetryCountRef.current = 0;
                    throw offsetErr;
                }
            }
            if (isHeader) hasAppendedInitRef.current = true;
            const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            sourceBuffer.appendBuffer(buffer);
            if (video?.paused && video.readyState >= 2 && !video.error) {
                video.play().catch(() => {});
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('removed from the parent media source') || msg.includes('error attribute is not null')) {
                sourceBufferDeadRef.current = true;
                sourceBufferRef.current = null;
                setError('Playback error');
            } else if (msg.includes('PARSING_MEDIA_SEGMENT') && timestampOffsetRetryCountRef.current < 15) {
                timestampOffsetRetryCountRef.current += 1;
                queue.unshift(item);
                setTimeout(processQueue, RETRY_PARSING_MS);
            } else {
                console.warn('[LIVE_DEBUG] appendBuffer failed:', err);
                setError('Buffer error');
            }
        }
    };

    useEffect(() => {
        if (!videoRef.current) return;

        console.log('[LIVE_DEBUG] MediaStreamPlayer mount callId=', callId, 'wsUrl=', wsUrl);

        queueRef.current = [];
        hasReceivedChunkRef.current = false;
        hasAppendedInitRef.current = false;
        sourceBufferDeadRef.current = false;
        deferHeaderProcessRef.current = false;
        timestampOffsetRetryCountRef.current = 0;
        setError(null);
        setIsPlaying(false);
        setShowWaitingHint(false);

        waitingTimeoutRef.current = setTimeout(() => {
            setShowWaitingHint(true);
            console.log('[LIVE_DEBUG] MediaStreamPlayer 12s timeout: no media:chunk received yet for callId=', callId);
        }, WAITING_HINT_AFTER_MS);

        // Create MediaSource
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        videoRef.current.src = URL.createObjectURL(mediaSource);

        const handleSourceOpen = () => {
            URL.revokeObjectURL(videoRef.current!.src); // Cleanup URL

            const videoEl = videoRef.current;
            if (videoEl) {
                videoEl.addEventListener('playing', () => setIsPlaying(true), { once: true });
            }

            try {
                const webmTypes = [
                    'video/webm;codecs=opus,vp9',
                    'video/webm;codecs=opus,vp8',
                    'video/webm;codecs=vp9,opus',
                    'video/webm;codecs=vp8,opus',
                    'video/webm;codecs=vp8,vorbis',
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8'
                ];
                const mimeType = webmTypes.find((t) => MediaSource.isTypeSupported(t)) ?? webmTypes[0];
                console.log('[LIVE_DEBUG] MediaStreamPlayer addSourceBuffer mimeType=', mimeType);

                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                sourceBufferRef.current = sourceBuffer;
                sourceBuffer.mode = 'segments';

                sourceBuffer.addEventListener('updateend', () => {
                    processQueue();
                });

                sourceBuffer.addEventListener('error', () => {
                    sourceBufferDeadRef.current = true;
                    sourceBufferRef.current = null;
                    try {
                        if (mediaSource.readyState === 'open') mediaSource.endOfStream();
                    } catch (_) { /* allow playback of already buffered range */ }
                    console.warn('[LIVE_DEBUG] SourceBuffer error — buffer removed');
                    setError('Playback error');
                });

                const ws = new WebSocket(`${wsUrl}?token=${token}`);
                ws.binaryType = 'arraybuffer';
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('[LIVE_DEBUG] MediaStreamPlayer WS open, sending manager:join callId=', callId);
                    ws.send(JSON.stringify({
                        type: 'manager:join',
                        payload: { callId }
                    }));
                };

                ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
                    const data = event.data;

                    if (data instanceof ArrayBuffer) {
                        const parsed = parseBinaryMediaChunk(data);
                        if (!parsed) return;
                        const { bytes, isHeader } = parsed;
                        if (!hasReceivedChunkRef.current) {
                            hasReceivedChunkRef.current = true;
                            console.log('[LIVE_DEBUG] MediaStreamPlayer first media chunk (binary) received');
                        }
                        if (!hasAppendedInitRef.current) {
                            if (!isHeader) return;
                        }
                        if (waitingTimeoutRef.current) {
                            clearTimeout(waitingTimeoutRef.current);
                            waitingTimeoutRef.current = null;
                        }
                        queueRef.current.push({ bytes, isHeader });
                        processQueue();
                        setShowWaitingHint(false);
                        if (queueRef.current.length >= 1 && !sourceBufferDeadRef.current && videoRef.current?.paused) {
                            videoRef.current.play().catch(() => {});
                        }
                        return;
                    }

                    try {
                        const message = JSON.parse(data as string);
                        if (message.type === 'manager:joined') {
                            console.log('[LIVE_DEBUG] MediaStreamPlayer manager:joined callId=', message.payload?.callId);
                            return;
                        }
                    } catch {
                        if (!hasReceivedChunkRef.current) setError('Invalid stream data');
                    }
                };

                ws.onerror = () => {
                    setError('Connection error');
                };

                ws.onclose = () => {
                    setIsPlaying(false);
                };

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Playback error';
                setError(message);
            }
        };

        mediaSource.addEventListener('sourceopen', handleSourceOpen);

        return () => {
            if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
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
    }, [callId, wsUrl, token]);

    return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden border border-gray-800 shadow-xl aspect-video">
            {error && (
                <div className="absolute top-2 left-2 bg-red-500/90 text-white px-3 py-1 rounded text-sm z-20 font-medium">
                    {error}
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
