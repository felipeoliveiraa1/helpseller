import { useRef, useMemo } from 'react';
import { useCoachingStore } from '../stores/coaching-store';
import { CardItem } from './CardItem';
import { BG_ELEVATED, BORDER, TEXT, TEXT_SECONDARY, TEXT_MUTED } from '../lib/theme';

const SPIN_PHASES: Record<string, { label: string; description: string; dot: string }> = {
    S: { label: 'Situação', description: 'Coletando fatos sobre o contexto', dot: '#737373' },
    P: { label: 'Problema', description: 'Descobrindo dores e insatisfações', dot: '#737373' },
    I: { label: 'Implicação', description: 'Amplificando as consequências', dot: '#737373' },
    N: { label: 'Necessidade', description: 'Fazendo o cliente verbalizar a solução', dot: '#737373' },
};

export function CoachPanel() {
    const cards = useCoachingStore(state => state.cards);
    const currentSpinPhase = useCoachingStore(state => state.currentSpinPhase);
    const scrollRef = useRef<HTMLDivElement>(null);

    const latestPhase = useMemo(() => {
        if (currentSpinPhase) return currentSpinPhase;
        const cardWithPhase = cards.find(c => !c.isDismissed && c.metadata?.phase);
        return cardWithPhase?.metadata?.phase || null;
    }, [cards, currentSpinPhase]);

    const phaseInfo = latestPhase ? SPIN_PHASES[latestPhase] : null;
    const activeCards = cards.filter(c => !c.isDismissed);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
            {phaseInfo && (
                <div
                    className="mx-3 mt-2 mb-1 px-2.5 py-2 rounded-lg border"
                    style={{ background: BG_ELEVATED, borderColor: BORDER }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>SPIN:{latestPhase}</span>
                            <span className="text-[13px] font-medium" style={{ color: TEXT_SECONDARY }}>{phaseInfo.label}</span>
                        </div>
                        <div className="flex gap-1">
                            {['S', 'P', 'I', 'N'].map(p => (
                                <div
                                    key={p}
                                    className="w-1.5 h-1.5 rounded-full transition-all"
                                    style={{ background: p === latestPhase ? phaseInfo.dot : '#262626' }}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>{phaseInfo.description}</p>
                </div>
            )}
            <div className="p-3 space-y-1">
                {activeCards.map(card => (
                    <CardItem key={card.id} card={card} />
                ))}
                {activeCards.length === 0 && (
                    <div className="py-8 flex flex-col items-center justify-center" style={{ color: TEXT_MUTED }}>
                        <p className="text-[13px]">{phaseInfo ? 'Analisando conversa...' : 'Aguardando conversa...'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
