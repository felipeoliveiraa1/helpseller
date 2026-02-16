import { useEffect, useState } from 'react';
import { useCoachingStore } from '../stores/coaching-store';
import { SidebarHeader } from './SidebarHeader';
import { StageIndicator } from './StageIndicator';
import { CoachPanel } from './CoachPanel';
// TranscriptMini removed — seller focuses only on SPIN coaching tips
import { NextStepFooter } from './NextStepFooter';
import { MinimizedBar } from './MinimizedBar';

export default function Sidebar() {
    const { isMinimized, isDark, toggleMinimize, setConnectionStatus, addCard, setStage, setLeadProfile, setCallSummary } = useCoachingStore();
    const [transcripts, setTranscripts] = useState<any[]>([]);

    useEffect(() => {
        // Mock connection status for demo if not driven by real events yet
        setConnectionStatus('recording');

        const listener = (msg: any) => {
            if (msg.type === 'TRANSCRIPT_UPDATE') {
                setTranscripts(prev => [...prev, { ...msg.data, speaker: 'lead' }]); // Mock speaker logic
            } else if (msg.type === 'STATUS_UPDATE') {
                if (msg.status === 'RECORDING') setConnectionStatus('recording');
                else if (msg.status === 'PROGRAMMED') setConnectionStatus('connected');
                else setConnectionStatus('disconnected');
            } else if (msg.type === 'COACHING_MESSAGE') {
                const payload = msg.data;
                const isObjection = payload.type === 'objection' && payload.metadata?.objection;
                const phase = payload.metadata?.phase || null;
                const phaseLabels: Record<string, string> = {
                    S: 'Situação', P: 'Problema', I: 'Implicação', N: 'Necessidade'
                };

                addCard({
                    type: isObjection ? 'objection' : 'tip',
                    title: isObjection
                        ? 'Objeção Detectada'
                        : `${phase ? phaseLabels[phase] || 'SPIN' : 'Dica'} — Próximo Passo`,
                    description: payload.content,
                    metadata: { ...payload.metadata, urgency: payload.urgency }
                });

                if (phase) setStage(phase === 'S' ? 0 : phase === 'P' ? 1 : phase === 'I' ? 2 : 3);
            } else if (msg.type === 'OBJECTION_DETECTED') {
                addCard({
                    type: 'objection',
                    title: 'Objeção Detectada',
                    description: msg.data.tip,
                    metadata: {
                        phase: msg.data.phase,
                        objection: msg.data.objection,
                        urgency: 'high'
                    }
                });
            } else if (msg.type === 'MANAGER_WHISPER') {
                addCard({
                    type: 'manager-whisper',
                    title: 'Mensagem do Gestor',
                    description: msg.data.content,
                    metadata: { source: 'manager', urgency: msg.data.urgency }
                });
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    // Also listen to window events if we want to simulate for dev
    useEffect(() => {
        const handleTest = (e: any) => {
            // e.g. window.postMessage({ type: 'TEST_CARD' }, '*')
        }
        window.addEventListener('message', handleTest);
        return () => window.removeEventListener('message', handleTest);
    }, []);

    if (isMinimized) {
        return <MinimizedBar />;
    }

    return (
        <div className={`h-full flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-[#fafafa] border-l border-[#262626]' : 'bg-white text-slate-900 border-l border-slate-200'}`}>
            <SidebarHeader />
            <StageIndicator />
            <CoachPanel />
            {/* TranscriptMini removed — CoachPanel is now the primary interface */}
            <NextStepFooter />
        </div>
    );
}
