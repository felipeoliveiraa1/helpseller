import { useEffect, useState } from 'react';
import { ShoppingCart, Zap, Lightbulb, AlertTriangle, Sparkles, X, Users } from 'lucide-react';
import { type CoachCard, useCoachingStore } from '../stores/coaching-store';
import { cn } from '@/lib/utils'; // Assuming we have utils from previous prompt setup or standard vite init

export function CardItem({ card, onDismiss }: { card: CoachCard; onDismiss?: (id: string) => void }) {
    const storeDismiss = useCoachingStore(state => state.dismissCard);
    const [visible, setVisible] = useState(false);

    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss(card.id);
        } else {
            storeDismiss(card.id);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const getCardStyles = (type: string, metadata?: any) => {
        // Manager whispers get highest priority urgent styling
        if (type === 'manager-whisper' || metadata?.source === 'manager') {
            return 'bg-gradient-to-br from-red-900/60 via-orange-900/50 to-yellow-900/40 border-2 border-yellow-500/70 text-white shadow-lg shadow-orange-500/30 ring-2 ring-yellow-400/50';
        }

        switch (type) {
            case 'signal':
                return 'bg-emerald-900/40 border-emerald-500/50 text-emerald-100';
            case 'objection':
                return 'bg-orange-900/40 border-orange-500/50 text-orange-100';
            case 'tip':
                return 'bg-blue-900/40 border-blue-500/50 text-blue-100';
            case 'alert':
                return 'bg-red-900/40 border-red-500/50 text-red-100';
            case 'reinforcement':
                return 'bg-indigo-900/40 border-indigo-500/50 text-indigo-100';
            default:
                return 'bg-slate-800 border-slate-700 text-slate-100';
        }
    };

    const getIcon = (type: string, metadata?: any) => {
        // Manager whispers get special icon
        if (type === 'manager-whisper' || metadata?.source === 'manager') {
            return <Users size={16} className="text-yellow-300 animate-pulse" />;
        }

        switch (type) {
            case 'signal': return <ShoppingCart size={16} className="text-emerald-400" />;
            case 'objection': return <Zap size={16} className="text-orange-400" />;
            case 'tip': return <Lightbulb size={16} className="text-blue-400" />;
            case 'alert': return <AlertTriangle size={16} className="text-red-400" />;
            case 'reinforcement': return <Sparkles size={16} className="text-indigo-400" />;
            default: return <Lightbulb size={16} />;
        }
    };

    if (card.isDismissed) return null;

    return (
        <div
            className={cn(
                "relative w-full rounded-lg border p-3 mb-3 transition-all duration-300 transform",
                getCardStyles(card.type, card.metadata),
                visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
                (card.type === 'signal' || card.type === 'manager-whisper') && "animate-pulse-border"
            )}
        >
            <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                    {getIcon(card.type, card.metadata)}
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                        {card.type === 'manager-whisper' || card.metadata?.source === 'manager'
                            ? '🎯 GERÊNCIA'
                            : card.type.replace('-', ' ')}
                    </span>
                    {(card.metadata?.urgency === 'high' || card.metadata?.urgency === 'urgent') && (
                        <span className="text-[10px] font-bold text-yellow-300 bg-red-600/80 px-1.5 py-0.5 rounded-full animate-pulse">
                            URGENTE
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] opacity-50">Just now</span>
                    <button
                        onClick={handleDismiss}
                        className="hover:bg-white/10 rounded p-0.5 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            <h4 className="font-semibold text-sm mb-1">{card.title}</h4>
            <p className="text-xs opacity-90 leading-relaxed">
                {card.description}
            </p>
        </div>
    );
}
