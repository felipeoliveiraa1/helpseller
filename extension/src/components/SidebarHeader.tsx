import { useEffect, useState } from 'react';
import { useCoachingStore } from '../stores/coaching-store';
import { Minimize2, Radio, Minus, Plus } from 'lucide-react';
import { BG_ELEVATED, BORDER, TEXT, TEXT_SECONDARY, TEXT_MUTED, ACCENT_ACTIVE, ACCENT_DANGER } from '../lib/theme';

const logoUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL('logo.svg') : '';

export function SidebarHeader() {
    const { isMinimized, toggleMinimize, connectionStatus, startTime, fontSizeOffset, setFontSizeOffset } = useCoachingStore();
    const [elapsed, setElapsed] = useState('00:00');

    useEffect(() => {
        if (!startTime) return;
        const interval = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            setElapsed(`${m}:${s}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    if (isMinimized) return null;

    const dotColor = connectionStatus === 'recording' ? ACCENT_DANGER : connectionStatus === 'connected' ? ACCENT_ACTIVE : '#525252';

    return (
        <div
            className="h-12 flex items-center justify-between px-3 border-b shrink-0"
            style={{ background: BG_ELEVATED, borderColor: BORDER }}
        >
            <div className="flex items-center gap-2">
                {logoUrl ? <img src={logoUrl} alt="HelpSeller" style={{ height: 20, width: 'auto' }} /> : <Radio size={14} style={{ color: TEXT_SECONDARY }} />}
                <span className="font-semibold text-[13px] tracking-tight" style={{ color: TEXT }}>HelpSeller</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
            </div>
            <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px]" style={{ color: TEXT_SECONDARY }}>{elapsed}</span>
                <div className="flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => setFontSizeOffset(fontSizeOffset - 1)}
                        disabled={fontSizeOffset <= -2}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30"
                        style={{ color: TEXT_MUTED }}
                        aria-label="Diminuir fonte"
                    >
                        <Minus size={10} />
                    </button>
                    <span className="text-[9px] font-mono w-4 text-center" style={{ color: TEXT_MUTED }}>
                        {fontSizeOffset === 0 ? 'A' : fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}
                    </span>
                    <button
                        onClick={() => setFontSizeOffset(fontSizeOffset + 1)}
                        disabled={fontSizeOffset >= 4}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30"
                        style={{ color: TEXT_MUTED }}
                        aria-label="Aumentar fonte"
                    >
                        <Plus size={10} />
                    </button>
                </div>
                <button onClick={toggleMinimize} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: TEXT_SECONDARY }} aria-label="Minimizar">
                    <Minimize2 size={14} />
                </button>
            </div>
        </div>
    );
}
