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
    const queueRef = useRef<Uint8Array[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Process the queue when SourceBuffer is ready
    const processQueue = () => {
        const sourceBuffer = sourceBufferRef.current;
        const queue = queueRef.current;

        if (sourceBuffer && !sourceBuffer.updating && queue.length > 0) {
            try {
                const chunk = queue.shift();
                if (chunk) {
                    sourceBuffer.appendBuffer(chunk);
                }
            } catch (err) {
                console.error('Error appending buffer:', err);
            }
        }
    };

    useEffect(() => {
        if (!videoRef.current) return;

        // Reset state
        queueRef.current = [];
        setError(null);
        setIsPlaying(false);

        // Create MediaSource
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        videoRef.current.src = URL.createObjectURL(mediaSource);

        const handleSourceOpen = () => {
            console.log('📹 MediaSource opened');
            URL.revokeObjectURL(videoRef.current!.src); // Cleanup URL

            try {
                // Try VP9 first, fallback to VP8
                const mimeType = MediaSource.isTypeSupported('video/webm; codecs="vp9,opus"')
                    ? 'video/webm; codecs="vp9,opus"'
                    : 'video/webm; codecs="vp8,opus"';

                console.log(`📋 Using mimeType for playback: ${mimeType}`);

                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                sourceBufferRef.current = sourceBuffer;
                sourceBuffer.mode = 'sequence'; // Ensure segments are played in order

                // Event listener to process queue when update finishes
                sourceBuffer.addEventListener('updateend', () => {
                    processQueue();
                });

                sourceBuffer.addEventListener('error', (e) => {
                    console.error('SourceBuffer error:', e);
                });

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

                ws.onmessage = async (event) => {
                    try {
                        const message = JSON.parse(event.data);

                        if (message.type === 'media:chunk') {
                            const chunkBase64 = message.payload.chunk;
                            // Convert Base64 to Uint8Array
                            const binaryString = atob(chunkBase64);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }

                            // Add to queue
                            queueRef.current.push(bytes);

                            // Try to process immediately
                            processQueue();

                            // Auto-play logic
                            if (videoRef.current && videoRef.current.paused && queueRef.current.length > 2) {
                                videoRef.current.play().catch(() => { });
                                setIsPlaying(true);
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
                setError(`Playback error: ${err.message}`);
            }
        };

        mediaSource.addEventListener('sourceopen', handleSourceOpen);

        return () => {
            // Cleanup
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
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto mb-3"></div>
                        <p className="text-gray-300 text-sm font-medium animate-pulse">Connecting to live feed...</p>
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
