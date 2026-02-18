import { X, ExternalLink, Award } from 'lucide-react';
import { useCoachingStore } from '../stores/coaching-store';
import { BG_ELEVATED, BORDER, TEXT, TEXT_SECONDARY } from '../lib/theme';
import { dashboardUrl } from '@/config/env';

export function CallEndModal() {
    const { showEndModal, setCallSummary, buyingSignalsCount } = useCoachingStore();

    if (!showEndModal) return null;

    return (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setCallSummary(false)} />
            <div
                className="relative w-full max-w-md rounded-lg overflow-hidden border animate-scale-in"
                style={{ background: BG_ELEVATED, borderColor: BORDER, color: TEXT }}
            >
                <div className="relative px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <h2 className="text-lg font-semibold mb-0.5">Chamada finalizada</h2>
                    <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>Resumo da chamada</p>
                    <button
                        onClick={() => setCallSummary(false)}
                        className="absolute top-4 right-4 p-1 rounded hover:bg-white/5 transition-colors"
                        style={{ color: TEXT_SECONDARY }}
                        aria-label="Fechar"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-center justify-center gap-2">
                        <Award size={20} style={{ color: TEXT_SECONDARY }} />
                        <span className="text-2xl font-semibold">85</span>
                        <span className="text-[13px]" style={{ color: TEXT_SECONDARY }}>/ 100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3 text-center border" style={{ background: '#0a0a0a', borderColor: BORDER }}>
                            <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: TEXT_SECONDARY }}>Sinais</div>
                            <div className="text-lg font-semibold">{buyingSignalsCount}</div>
                        </div>
                        <div className="rounded-lg p-3 text-center border" style={{ background: '#0a0a0a', borderColor: BORDER }}>
                            <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: TEXT_SECONDARY }}>Duração</div>
                            <div className="text-lg font-semibold">12:30</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2 py-1 rounded text-[11px] border" style={{ background: '#171717', borderColor: BORDER, color: TEXT_SECONDARY }}>Rapport</span>
                        <span className="px-2 py-1 rounded text-[11px] border" style={{ background: '#171717', borderColor: BORDER, color: TEXT_SECONDARY }}>Objeções</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                            onClick={() => setCallSummary(false)}
                            className="px-3 py-2 rounded text-[13px] font-medium border transition-colors hover:bg-white/5"
                            style={{ borderColor: BORDER, color: TEXT }}
                        >
                            Fechar
                        </button>
                        <a
                            href={`${dashboardUrl}/calls`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                            style={{ background: '#3b82f6', color: 'white' }}
                        >
                            Dashboard
                            <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
