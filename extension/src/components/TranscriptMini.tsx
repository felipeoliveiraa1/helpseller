import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useCoachingStore } from '../stores/coaching-store';

interface Transcript {
    text: string;
    speaker: 'user' | 'lead';
    timestamp: number;
}

export function TranscriptMini({ transcripts }: { transcripts: Transcript[] }) {
    const [expanded, setExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const stuckToBottomRef = useRef(true);
    const [hasNewBelow, setHasNewBelow] = useState(false);
    const fontSizeOffset = useCoachingStore(state => state.fontSizeOffset);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (stuckToBottomRef.current) {
            el.scrollTop = el.scrollHeight;
            if (hasNewBelow) setHasNewBelow(false);
        } else {
            setHasNewBelow(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcripts.length, expanded]);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        stuckToBottomRef.current = atBottom;
        if (atBottom) setHasNewBelow(false);
    }, []);

    const jumpToBottom = () => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        stuckToBottomRef.current = true;
        setHasNewBelow(false);
    };

    // Show last 3 messages if collapsed
    const displayedTranscripts = expanded ? transcripts : transcripts.slice(-3);

    return (
        <div className={`relative shrink-0 border-t border-white/10 bg-[#1A1B2E] transition-all duration-300 ${expanded ? 'h-64' : 'h-auto max-h-40'
            }`}>
            <div
                className="px-4 py-1 flex items-center justify-center cursor-pointer hover:bg-white/5"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
            </div>

            <div
                className="px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar"
                style={{ height: expanded ? 'calc(100% - 24px)' : 'auto' }}
                ref={scrollRef}
                onScroll={handleScroll}
            >
                {displayedTranscripts.map((t, i) => (
                    <div key={i} className={`leading-snug ${t.speaker === 'user' ? 'text-blue-200' : 'text-slate-300'}`}
                        style={{ fontSize: 14 + fontSizeOffset }}>
                        <span className="font-bold mr-1 opacity-50" style={{ fontSize: 12 + fontSizeOffset }}>
                            {t.speaker === 'user' ? 'VOCÊ' : 'LEAD'}:
                        </span>
                        {t.text}
                    </div>
                ))}
            </div>
            {hasNewBelow && expanded && (
                <button
                    onClick={jumpToBottom}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold bg-blue-500 text-white shadow-lg hover:brightness-110"
                >
                    ↓ novas mensagens
                </button>
            )}
        </div>
    );
}
