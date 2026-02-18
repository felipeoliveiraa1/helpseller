'use client';

import { useCallback, useRef, useState } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack, Track } from 'livekit-client';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { LiveKitViewer } from '@/components/LiveKitViewer';
import { Button } from '@/components/ui/button';

const LOG_PREFIX = '[LIVEKIT_TEST]';
const TEST_ROOM = 'test-room';
const PUBLISHER_IDENTITY = 'publisher_test';
const VIEWER_IDENTITY = 'viewer_test';

export default function LiveTestPage() {
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const roomRef = useRef<Room | null>(null);

    const startPublishing = useCallback(async () => {
        const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!serverUrl) {
            setError('Defina NEXT_PUBLIC_LIVEKIT_URL no .env.local');
            return;
        }
        setError(null);
        try {
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });
            } catch (e) {
                console.warn(`${LOG_PREFIX} getDisplayMedia failed:`, e);
                setError('Permissão de compartilhar tela/áudio negada.');
                return;
            }

            const res = await fetch('/api/livekit/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    roomName: TEST_ROOM,
                    identity: PUBLISHER_IDENTITY,
                    role: 'publisher',
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { error?: string }).error ?? 'Falha ao obter token');
            }
            const { token } = (await res.json()) as { token: string };

            if (roomRef.current) {
                await roomRef.current.disconnect();
                roomRef.current = null;
            }

            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                stopLocalTrackOnUnpublish: true,
            });
            roomRef.current = room;

            room.on('disconnected', () => {
                console.log(`${LOG_PREFIX} Publisher disconnected`);
                setPublishing(false);
            });

            await room.connect(serverUrl, token);
            console.log(`${LOG_PREFIX} Connected as publisher to room=${TEST_ROOM}`);

            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            if (videoTracks.length > 0) {
                const videoTrack = new LocalVideoTrack(videoTracks[0], undefined, false);
                videoTrack.source = Track.Source.ScreenShare;
                await room.localParticipant.publishTrack(videoTrack, {
                    name: 'screen',
                    source: Track.Source.ScreenShare,
                });
            }
            if (audioTracks.length > 0) {
                const audioTrack = new LocalAudioTrack(audioTracks[0], undefined, false);
                audioTrack.source = Track.Source.ScreenShareAudio;
                await room.localParticipant.publishTrack(audioTrack, {
                    name: 'screen-audio',
                    source: Track.Source.ScreenShareAudio,
                });
            }
            setPublishing(true);
        } catch (err) {
            console.error(`${LOG_PREFIX} Publish error:`, err);
            setError(err instanceof Error ? err.message : 'Erro ao publicar');
        }
    }, []);

    const stopPublishing = useCallback(async () => {
        if (roomRef.current) {
            await roomRef.current.disconnect();
            roomRef.current = null;
        }
        setPublishing(false);
    }, []);

    return (
        <div className="space-y-6">
            <DashboardHeader title="LiveKit – Teste" />
            <div className="rounded-[24px] border p-6 bg-[#1e1e1e] border-white/5">
                <h2 className="text-lg font-semibold text-white mb-4">Publicar (teste local)</h2>
                <p className="text-gray-400 text-sm mb-4">
                    Ao clicar, o navegador abre o seletor de compartilhamento (por segurança). Escolha <strong className="text-gray-300">“Aba do Chrome”</strong> e selecione a aba do Meet (ou qualquer aba) para publicar no room <code className="bg-black/30 px-1 rounded">{TEST_ROOM}</code>. O viewer abaixo assina a mesma sala.
                </p>
                <div className="flex gap-2">
                    <Button
                        onClick={startPublishing}
                        disabled={publishing}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {publishing ? 'Publicando...' : 'Start Publishing (test)'}
                    </Button>
                    {publishing && (
                        <Button variant="outline" onClick={stopPublishing}>
                            Parar
                        </Button>
                    )}
                </div>
                {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
            </div>
            <div className="rounded-[24px] border overflow-hidden bg-[#1e1e1e] border-white/5">
                <h2 className="text-lg font-semibold text-white p-4 border-b border-white/5">Viewer (mesma sala)</h2>
                <div className="p-4">
                    <LiveKitViewer roomName={TEST_ROOM} identity={VIEWER_IDENTITY} />
                </div>
            </div>
        </div>
    );
}
