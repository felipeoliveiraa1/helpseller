import { useCoachingStore } from '../stores/coaching-store';
import { User, Mic, ShoppingCart } from 'lucide-react';
import { BG_ELEVATED, BORDER, TEXT, TEXT_SECONDARY } from '../lib/theme';

export function NextStepFooter() {
    const { nextStep, nextStepQuestion, leadProfile, buyingSignalsCount, activeSpeaker, setSpeaker } = useCoachingStore();

    return (
        <div className="shrink-0 border-t text-[13px]" style={{ background: BG_ELEVATED, borderColor: BORDER, color: TEXT }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-2">
                    <User size={12} style={{ color: TEXT_SECONDARY }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>{leadProfile}</span>
                    <span className="w-px h-2.5" style={{ background: BORDER }} />
                    <div className="flex items-center gap-1" style={{ color: TEXT_SECONDARY }}>
                        <ShoppingCart size={12} />
                        <span className="text-[11px] font-medium">{buyingSignalsCount} sinais</span>
                    </div>
                </div>
                <div className="flex rounded-md p-0.5 gap-0" style={{ background: '#171717', border: `1px solid ${BORDER}` }}>
                    <button
                        onClick={() => setSpeaker('user')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${activeSpeaker === 'user' ? 'bg-[#262626]' : ''}`}
                        style={{ color: activeSpeaker === 'user' ? TEXT : TEXT_SECONDARY }}
                    >
                        <Mic size={10} />
                        Eu
                    </button>
                    <button
                        onClick={() => setSpeaker('lead')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${activeSpeaker === 'lead' ? 'bg-[#262626]' : ''}`}
                        style={{ color: activeSpeaker === 'lead' ? TEXT : TEXT_SECONDARY }}
                    >
                        <User size={10} />
                        Lead
                    </button>
                </div>
            </div>
            <div className="p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: TEXT_SECONDARY }}>Próximo passo</div>
                <div className="font-medium text-[13px] mb-0.5" style={{ color: TEXT }}>{nextStep}</div>
                <div className="text-[12px] italic" style={{ color: TEXT_SECONDARY }}>&quot;{nextStepQuestion}&quot;</div>
            </div>
        </div>
    );
}
