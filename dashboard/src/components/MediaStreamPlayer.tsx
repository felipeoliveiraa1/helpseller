/**
 * MediaStreamPlayer - Real-time WebM video player for manager supervision
 * Receives chunks via WebSocket and plays using MediaSource API
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface MediaStreamPlayerProps {
    callId: string;
    wsUrl: string;
    token: string;
}

export function MediaStreamPlayer({ callId, wsUrl, token }: MediaStreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        // Create MediaSource
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        videoRef.current.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', () => {
            console.log('📹 MediaSource opened');

            try {
                // Create SourceBuffer for WebM
                const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp9,opus"');
                sourceBufferRef.current = sourceBuffer;

                sourceBuffer.mode = 'sequence'; // Automatic timestamp management

                console.log('✅ SourceBuffer created');

                // Connect to WebSocket
                const ws = new WebSocket(`${wsUrl}?token=${token}`);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('📡 WebSocket connected, joining call...');
                    ws.send(JSON.stringify({
                        type: 'manager:join',
                        payload: { callId }
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);

                        if (message.type === 'media:chunk') {
                            // Receive WebM chunk
                            const chunk = message.payload.chunk;
                            const buffer = Uint8Array.from(atob(chunk), c => c.charCodeAt(0));

                            if (sourceBuffer && !sourceBuffer.updating) {
                                sourceBuffer.appendBuffer(buffer);

                                // Auto-play once we have enough data
                                if (videoRef.current && videoRef.current.paused && videoRef.current.readyState >= 2) {
                                    videoRef.current.play().catch(err => {
                                        console.warn('Auto-play prevented:', err);
                                    });
                                    setIsPlaying(true);
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error processing message:', err);
                    }
                };

                ws.onerror = (err) => {
                    console.error('WebSocket error:', err);
                    setError('Connection error');
                };

                ws.onclose = () => {
                    console.log('📡 WebSocket disconnected');
                    setIsPlaying(false);
                };

            } catch (err: any) {
                console.error('Failed to create SourceBuffer:', err);
                setError(err.message);
            }
        });

        return () => {
            // Cleanup
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                mediaSourceRef.current.endOfStream();
            }
        };
    }, [callId, wsUrl, token]);

    return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
            {error && (
                <div className="absolute top-2 left-2 bg-red-500/90 text-white px-3 py-1 rounded text-sm z-10">
                    {error}
                </div>
            )}

            {!isPlaying && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Connecting to call...</p>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-auto"
                controls
                muted={false}
                playsInline
            />

            {isPlaying && (
                <div className="absolute top-2 left-2 bg-green-500/90 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                </div>
            )}
        </div>
    );
}
