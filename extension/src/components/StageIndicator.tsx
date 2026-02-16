import { useState } from 'react';
import { useCoachingStore } from '../stores/coaching-store';
import { ChevronDown, CheckCircle, PlayCircle, Circle } from 'lucide-react';
import { BG_ELEVATED, BORDER, TEXT, TEXT_SECONDARY, ACCENT_ACTIVE } from '../lib/theme';

export function StageIndicator() {
    const { stages, currentStageIndex, setStage } = useCoachingStore();
    const [expanded, setExpanded] = useState(false);

    const currentStage = stages[currentStageIndex];
    const progress = Math.round(((currentStageIndex + 1) / stages.length) * 100);

    return (
        <div className="shrink-0 border-b relative z-20" style={{ background: BG_ELEVATED, borderColor: BORDER, color: TEXT }}>
            <div className="px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>
                            Etapa {currentStageIndex + 1}/{stages.length}
                        </span>
                        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: TEXT_SECONDARY }} />
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: TEXT_SECONDARY }}>{progress}%</span>
                </div>
                <h3 className="font-semibold text-[14px] leading-tight mb-1.5">{currentStage.name}</h3>
                <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: '#262626' }}>
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: ACCENT_ACTIVE }}
                    />
                </div>
            </div>
            {expanded && (
                <div
                    className="absolute top-full left-0 w-full border-b shadow-lg max-h-56 overflow-y-auto custom-scrollbar"
                    style={{ background: BG_ELEVATED, borderColor: BORDER }}
                >
                    {stages.map((stage, idx) => (
                        <div
                            key={stage.id}
                            onClick={() => { setStage(idx); setExpanded(false); }}
                            className={`px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-white/[0.03] border-b last:border-0 ${idx === currentStageIndex ? 'bg-white/[0.03]' : ''}`}
                            style={{ borderColor: BORDER }}
                        >
                            {idx < currentStageIndex ? (
                                <CheckCircle size={14} style={{ color: TEXT_SECONDARY }} />
                            ) : idx === currentStageIndex ? (
                                <PlayCircle size={14} style={{ color: ACCENT_ACTIVE }} />
                            ) : (
                                <Circle size={14} style={{ color: '#262626' }} />
                            )}
                            <span className="text-[13px]" style={{ color: idx === currentStageIndex ? TEXT : TEXT_SECONDARY, fontWeight: idx === currentStageIndex ? 500 : 400 }}>
                                {stage.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
