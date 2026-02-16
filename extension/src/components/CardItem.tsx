import { useEffect, useState } from 'react';
import { ShoppingCart, Zap, Lightbulb, AlertTriangle, Sparkles, X, MessageSquare, Target } from 'lucide-react';
import { type CoachCard, useCoachingStore } from '../stores/coaching-store';
import { BG_ELEVATED, BORDER, TEXT, TEXT_SECONDARY, TEXT_MUTED, ACCENT_DANGER, INPUT_BG } from '../lib/theme';

export function CardItem({ card, onDismiss }: { card: CoachCard; onDismiss?: (id: string) => void }) {
    const storeDismiss = useCoachingStore(state => state.dismissCard);
    const [visible, setVisible] = useState(false);

    const handleDismiss = () => {
        if (onDismiss) onDismiss(card.id);
        else storeDismiss(card.id);
    };

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const getIcon = (type: string, metadata?: Record<string, unknown>) => {
        if (type === 'manager-whisper' || metadata?.source === 'manager') return <MessageSquare size={14} style={{ color: TEXT_SECONDARY }} />;
        switch (type) {
            case 'signal': return <ShoppingCart size={14} style={{ color: TEXT_SECONDARY }} />;
            case 'objection': return <Zap size={14} style={{ color: TEXT_SECONDARY }} />;
            case 'tip': return <Lightbulb size={14} style={{ color: TEXT_SECONDARY }} />;
            case 'alert': return <AlertTriangle size={14} style={{ color: ACCENT_DANGER }} />;
            case 'reinforcement': return <Sparkles size={14} style={{ color: TEXT_SECONDARY }} />;
            default: return <Lightbulb size={14} style={{ color: TEXT_MUTED }} />;
        }
    };

    if (card.isDismissed) return null;

    const typeLabel = card.type === 'manager-whisper' || card.metadata?.source === 'manager' ? 'Gestor' : card.type.replace('-', ' ');
    const isUrgent = card.metadata?.urgency === 'high' || card.metadata?.urgency === 'urgent';

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                borderRadius: '8px',
                border: `1px solid ${BORDER}`,
                padding: 10,
                marginBottom: 8,
                background: BG_ELEVATED,
                color: TEXT,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(8px)',
                transition: 'opacity 0.2s, transform 0.2s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {getIcon(card.type, card.metadata)}
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT_SECONDARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeLabel}
                    </span>
                    {isUrgent && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: ACCENT_DANGER, background: 'rgba(220,38,38,0.15)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>Urgente</span>
                    )}
                    {card.metadata?.phase && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: TEXT_MUTED, background: BORDER, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>SPIN:{String(card.metadata.phase)}</span>
                    )}
                </div>
                <button onClick={handleDismiss} style={{ flexShrink: 0, padding: 4, borderRadius: 4, border: 'none', background: 'transparent', color: TEXT_MUTED, cursor: 'pointer', display: 'flex' }} aria-label="Fechar">
                    <X size={12} />
                </button>
            </div>
            <h4 style={{ fontWeight: 500, fontSize: 13, marginBottom: 2, color: TEXT, lineHeight: 1.25 }}>{card.title}</h4>
            <p style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{card.description}</p>
            {card.type === 'objection' && card.metadata?.objection && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TEXT_SECONDARY, background: INPUT_BG, borderRadius: 4, padding: '4px 8px', border: `1px solid ${BORDER}` }}>
                    <Target size={10} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, color: TEXT_MUTED }}>Objeção:</span> {String(card.metadata.objection)}
                </div>
            )}
        </div>
    );
}
