import { Maximize2, Radio } from 'lucide-react';
import { useCoachingStore } from '../stores/coaching-store';
import { BG, BORDER, TEXT_SECONDARY, ACCENT_DANGER } from '../lib/theme';

export function MinimizedBar() {
    const { toggleMinimize, connectionStatus, cards } = useCoachingStore();
    const hasUrgentAlert = cards.some(c =>
        !c.isDismissed &&
        (c.type === 'alert' || c.type === 'signal') &&
        Date.now() - c.timestamp < 5000
    );

    const dotColor = connectionStatus === 'recording' ? ACCENT_DANGER : connectionStatus === 'connected' ? '#3b82f6' : '#525252';

    return (
        <div
            className="fixed top-0 right-0 h-screen w-12 flex flex-col items-center py-3 z-[2147483647] cursor-pointer"
            style={{
                background: BG,
                borderLeft: `1px solid ${BORDER}`,
                borderLeftWidth: hasUrgentAlert ? 2 : 1,
                borderLeftColor: hasUrgentAlert ? ACCENT_DANGER : BORDER,
            }}
            onClick={toggleMinimize}
        >
            <button className="mb-4 p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: TEXT_SECONDARY }} aria-label="Expandir">
                <Maximize2 size={18} />
            </button>
            <div className="w-2 h-2 rounded-full mb-4" style={{ background: dotColor }} />
            <div className="flex-1 flex items-center justify-center">
                <div className="rotate-90 whitespace-nowrap flex items-center gap-1 text-[10px] font-semibold tracking-widest" style={{ color: TEXT_SECONDARY, opacity: 0.7 }}>
                    <Radio size={12} className="-rotate-90" />
                    Call Coach
                </div>
            </div>
        </div>
    );
}
