'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom, useRoomContext, useRemoteParticipants } from '@livekit/components-react';
import { Track, TrackEvent } from 'livekit-client';

const LOG_PREFIX = '[LIVEKIT_VIEWER]';

export type LiveKitViewerStatus = 'connecting' | 'live' | 'disconnected' | 'error';

interface LiveKitViewerProps {
    /** Room name (e.g. callId). */
    roomName: string;
    /** Participant identity (e.g. manager_<userId>). */
    identity: string;
    /** Optional: base URL for API (defaults to same origin). */
    apiBaseUrl?: string;
    /** Callback when status changes. */
    onStatusChange?: (status: LiveKitViewerStatus) => void;
}

/**
 * Fetches a viewer token from the Next.js API. Never generates token on the client.
 */
async function fetchViewerToken(
    apiBaseUrl: string,
    roomName: string,
    identity: string
): Promise<string> {
    const url = `${apiBaseUrl.replace(/\/$/, '')}/api/livekit/token`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            roomName,
            identity,
            role: 'viewer',
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? 'Failed to get token');
    }
    const data = (await res.json()) as { token: string };
    return data.token;
}

function ViewerContent() {
    useRoomContext();
    const remoteParticipants = useRemoteParticipants();
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [hasVideo, setHasVideo] = useState(false);
    const attachedVideoRef = useRef<{ track: Track; pub: { off: (e: string, fn: (t: Track) => void) => void } } | null>(null);
    const attachedAudioRef = useRef<{ track: Track; pub: { off: (e: string, fn: (t: Track) => void) => void } } | null>(null);

    useEffect(() => {
        let videoPub: { setSubscribed: (v: boolean) => void; track?: Track | null; on: (e: string, fn: (t: Track) => void) => void; off: (e: string, fn: (t: Track) => void) => void } | null = null;
        let audioPub: { setSubscribed: (v: boolean) => void; track?: Track | null; on: (e: string, fn: (t: Track) => void) => void; off: (e: string, fn: (t: Track) => void) => void } | null = null;
        for (const p of remoteParticipants) {
            for (const pub of p.trackPublications.values()) {
                if (!videoPub && pub.kind === Track.Kind.Video && (pub.source === Track.Source.ScreenShare || pub.source === Track.Source.Camera)) {
                    videoPub = pub as typeof videoPub;
                }
                if (!audioPub && pub.kind === Track.Kind.Audio && (pub.source === Track.Source.Microphone || pub.source === Track.Source.ScreenShareAudio)) {
                    audioPub = pub as typeof audioPub;
                }
            }
        }
        const onVideoSubscribed = (track: Track): void => {
            const el = videoRef.current;
            if (el) {
                track.attach(el);
                el.play().catch(() => {});
                setHasVideo(true);
                attachedVideoRef.current = { track, pub: videoPub! };
            }
        };
        const onAudioSubscribed = (track: Track): void => {
            const el = audioRef.current;
            if (el) {
                track.attach(el);
                el.play().catch(() => {});
                attachedAudioRef.current = { track, pub: audioPub! };
            }
        };
        if (videoPub) {
            if (videoPub.track) {
                onVideoSubscribed(videoPub.track);
            } else {
                videoPub.on(TrackEvent.Subscribed, onVideoSubscribed);
                videoPub.setSubscribed(true);
            }
        }
        if (audioPub) {
            if (audioPub.track) {
                onAudioSubscribed(audioPub.track);
            } else {
                audioPub.on(TrackEvent.Subscribed, onAudioSubscribed);
                audioPub.setSubscribed(true);
            }
        }
        return () => {
            if (attachedVideoRef.current?.track && videoRef.current) {
                attachedVideoRef.current.track.detach(videoRef.current);
            }
            if (attachedAudioRef.current?.track && audioRef.current) {
                attachedAudioRef.current.track.detach(audioRef.current);
            }
            videoPub?.off(TrackEvent.Subscribed, onVideoSubscribed);
            audioPub?.off(TrackEvent.Subscribed, onAudioSubscribed);
            attachedVideoRef.current = null;
            attachedAudioRef.current = null;
            setHasVideo(false);
        };
    }, [remoteParticipants]);

    if (remoteParticipants.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center bg-black rounded-lg text-gray-500 text-sm">
                Aguardando participante...
            </div>
        );
    }
    return (
        <div className="relative flex flex-1 items-center justify-center bg-black rounded-lg p-2">
            <video
                ref={videoRef}
                className="max-w-full max-h-full w-full h-full object-contain rounded"
                autoPlay
                playsInline
                muted
            />
            <audio ref={audioRef} autoPlay playsInline className="hidden" />
            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    Aguardando transmissão do vendedor...
                </div>
            )}
        </div>
    );
}

export function LiveKitViewer({
    roomName,
    identity,
    apiBaseUrl = '',
    onStatusChange,
}: LiveKitViewerProps) {
    const serverUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_LIVEKIT_URL : undefined;
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<LiveKitViewerStatus>('connecting');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const reconnectAttemptRef = useRef(0);
    const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

    const updateStatus = useCallback(
        (next: LiveKitViewerStatus) => {
            setStatus(next);
            onStatusChange?.(next);
        },
        [onStatusChange]
    );

    const fetchToken = useCallback(async () => {
        console.log(`${LOG_PREFIX} Fetching token roomName=${roomName} identity=${identity}`);
        const t = await fetchViewerToken(baseUrl, roomName, identity);
        setToken(t);
        setErrorMessage(null);
        return t;
    }, [baseUrl, roomName, identity]);

    useEffect(() => {
        if (!serverUrl || !roomName || !identity) {
            if (!serverUrl) {
                setErrorMessage('LiveKit não configurado (NEXT_PUBLIC_LIVEKIT_URL)');
                updateStatus('error');
            }
            return;
        }
        let cancelled = false;
        fetchToken()
            .then(() => {
                if (!cancelled) console.log(`${LOG_PREFIX} Token obtained, connecting to room=${roomName}`);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.warn(`${LOG_PREFIX} Token fetch failed:`, err);
                    setErrorMessage(err instanceof Error ? err.message : 'Erro ao obter token');
                    updateStatus('error');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [serverUrl, roomName, identity, fetchToken, updateStatus]);

    const handleConnected = useCallback(() => {
        console.log(`${LOG_PREFIX} Connected to room=${roomName}`);
        reconnectAttemptRef.current = 0;
        updateStatus('live');
    }, [roomName, updateStatus]);

    const handleDisconnected = useCallback(() => {
        console.log(`${LOG_PREFIX} Disconnected from room=${roomName}`);
        updateStatus('disconnected');
    }, [roomName, updateStatus]);

    const handleError = useCallback(
        (error: Error) => {
            console.warn(`${LOG_PREFIX} Room error:`, error);
            setErrorMessage(error.message);
            updateStatus('error');
        },
        [updateStatus]
    );

    if (!serverUrl) {
        return (
            <div className="relative w-full bg-black rounded-lg border border-gray-800 aspect-video flex items-center justify-center">
                <p className="text-gray-500 text-sm">LiveKit não configurado. Defina NEXT_PUBLIC_LIVEKIT_URL.</p>
            </div>
        );
    }

    if (status === 'error' && errorMessage) {
        return (
            <div className="relative w-full bg-black rounded-lg border border-gray-800 aspect-video flex flex-col items-center justify-center gap-2">
                <p className="text-red-400 text-sm">{errorMessage}</p>
                <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"
                    onClick={() => {
                        setErrorMessage(null);
                        updateStatus('connecting');
                        fetchToken();
                    }}
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="relative w-full bg-black rounded-lg border border-gray-800 aspect-video flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
                <p className="ml-3 text-gray-400 text-sm">Conectando ao LiveKit...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full rounded-lg border border-gray-800 overflow-hidden aspect-video bg-black">
            <LiveKitRoom
                serverUrl={serverUrl}
                token={token}
                connect={true}
                audio={false}
                video={false}
                options={{
                    adaptiveStream: true,
                    dynacast: true,
                    disconnectOnPageLeave: true,
                }}
                connectOptions={{
                    autoSubscribe: true,
                }}
                onConnected={handleConnected}
                onDisconnected={handleDisconnected}
                onError={handleError}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
                <ViewerContent />
                {status === 'live' && (
                    <div className="absolute top-2 right-2 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1.5 z-10">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        LIVE
                    </div>
                )}
                {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
                    </div>
                )}
            </LiveKitRoom>
        </div>
    );
}
