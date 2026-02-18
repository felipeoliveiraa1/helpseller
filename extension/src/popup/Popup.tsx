import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/auth';
import { Loader2, Mic, Square, LogOut, Monitor, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { TEXT, TEXT_SECONDARY, TEXT_MUTED, INPUT_BG, INPUT_BORDER, ACCENT_ACTIVE, ACCENT_DANGER, NEON_PINK, NEON_PINK_LIGHT, RADIUS } from '../lib/theme';

const BG_CARD = 'rgba(255,255,255,0.04)';
const BORDER_PINK = 'rgba(255, 0, 122, 0.25)';
const logoUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL('logo.svg') : '/logo.svg';

interface TabOption {
    id: number;
    title: string;
    url: string;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Popup() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'PROGRAMMED' | 'RECORDING' | 'PAUSED'>('PROGRAMMED');
    const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [tabs, setTabs] = useState<TabOption[]>([]);
    const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
    const [suggestionsPanelOpen, setSuggestionsPanelOpen] = useState(false);
    const [isMeetOrZoomTab, setIsMeetOrZoomTab] = useState(false);
    const [activeTabId, setActiveTabId] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        checkSession();
    }, []);

    useEffect(() => {
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes.sidebarOpen != null) {
                setSuggestionsPanelOpen(!!changes.sidebarOpen.newValue);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (!tab?.id || !tab.url) {
                setIsMeetOrZoomTab(false);
                setActiveTabId(null);
                return;
            }
            setActiveTabId(tab.id);
            const url = tab.url.toLowerCase();
            const isMeetZoom = url.includes('meet.google.com') || url.includes('zoom.us');
            setIsMeetOrZoomTab(isMeetZoom);
            if (isMeetZoom) {
                chrome.tabs.sendMessage(tab.id, { type: 'GET_SIDEBAR_OPEN' }, (response: { open?: boolean } | undefined) => {
                    if (response && typeof response.open === 'boolean') {
                        setSuggestionsPanelOpen(response.open);
                    }
                });
            }
        });
    }, []);

    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: { status?: string; recordingStartedAt?: number | null } | undefined) => {
            if (response?.status === 'RECORDING' || response?.status === 'PROGRAMMED' || response?.status === 'PAUSED') {
                setStatus(response.status);
            }
            if (response?.recordingStartedAt != null) {
                setRecordingStartedAt(response.recordingStartedAt);
            } else {
                setRecordingStartedAt(null);
            }
        });
    }, []);

    useEffect(() => {
        if (status === 'RECORDING' && recordingStartedAt != null) {
            const tick = () => {
                setElapsedSeconds(Math.floor((Date.now() - recordingStartedAt) / 1000));
            };
            tick();
            timerRef.current = setInterval(tick, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
            };
        } else {
            setElapsedSeconds(0);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [status, recordingStartedAt]);

    useEffect(() => {
        if (!session || status === 'RECORDING') return;
        chrome.tabs.query({ currentWindow: true }, (list) => {
            const options: TabOption[] = list
                .filter((t) => t.id != null && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
                .map((t) => ({
                    id: t.id!,
                    title: t.title || t.url || 'Aba',
                    url: t.url || ''
                }));
            setTabs(options);
            if (options.length > 0 && selectedTabId === null) {
                chrome.tabs.query({ active: true, currentWindow: true }, ([active]) => {
                    const activeInList = options.find((o) => o.id === active?.id);
                    setSelectedTabId(activeInList ? activeInList.id : options[0].id);
                });
            }
        });
    }, [session, status]);

    const checkSession = async () => {
        const sess = await authService.getSession();
        setSession(sess);
        setLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login(email, password);
            await checkSession();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        setSession(null);
    };

    const toggleCapture = async () => {
        const tabId = status === 'RECORDING' ? undefined : (selectedTabId ?? tabs[0]?.id ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id);
        if (status === 'RECORDING') {
            setStatus('PROGRAMMED');
            setRecordingStartedAt(null);
        } else {
            setStatus('RECORDING');
            setRecordingStartedAt(Date.now());
        }
        chrome.runtime.sendMessage({
            type: status === 'RECORDING' ? 'STOP_CAPTURE' : 'START_CAPTURE',
            tabId: tabId ?? undefined
        });
    };

    const toggleSuggestionsPanel = () => {
        if (activeTabId == null) return;
        chrome.tabs.sendMessage(activeTabId, { type: 'TOGGLE_SIDEBAR' }).then(() => {
            setSuggestionsPanelOpen((prev) => !prev);
        }).catch(() => {
            // Tab may not have content script (not Meet/Zoom)
        });
    };

    useEffect(() => {
        const listener = (msg: any) => {
            if (msg.type === 'STATUS_UPDATE') {
                setStatus(msg.status);
                if (msg.status !== 'RECORDING') {
                    setRecordingStartedAt(null);
                } else {
                    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (r: { recordingStartedAt?: number | null } | undefined) => {
                        if (r?.recordingStartedAt != null) setRecordingStartedAt(r.recordingStartedAt);
                    });
                }
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const base: React.CSSProperties = {
        width: '100%',
        minHeight: '380px',
        color: TEXT,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        zIndex: 1,
        padding: '20px 16px',
        boxSizing: 'border-box',
    };

    if (loading) {
        return (
            <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={28} style={{ color: NEON_PINK }} className="animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div style={{ ...base, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: TEXT, letterSpacing: '-0.02em' }}>Entrar</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, marginBottom: 4, color: TEXT_SECONDARY }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: RADIUS, border: `1px solid ${INPUT_BORDER}`, background: INPUT_BG, color: TEXT, fontSize: 13, boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, marginBottom: 4, color: TEXT_SECONDARY }}>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: RADIUS, border: `1px solid ${INPUT_BORDER}`, background: INPUT_BG, color: TEXT, fontSize: 13, boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    {error && <p style={{ color: ACCENT_DANGER, fontSize: 12 }}>{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: 12, borderRadius: RADIUS, border: 'none', background: `linear-gradient(135deg, ${NEON_PINK}, ${NEON_PINK_LIGHT})`, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        );
    }

    const isRecording = status === 'RECORDING';

    return (
        <div style={base}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <img src={logoUrl} alt="HelpSeller" style={{ height: 24, width: 'auto' }} />
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: 4 }} aria-label="Sair">
                    <LogOut size={16} />
                </button>
            </div>
            <p style={{ fontSize: 10, color: TEXT_SECONDARY, marginBottom: 16 }}>{session.user?.email}</p>

            {isMeetOrZoomTab && (
                <div style={{ marginBottom: 16 }}>
                    <button
                        type="button"
                        onClick={toggleSuggestionsPanel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: RADIUS,
                            border: `1px solid ${BORDER_PINK}`,
                            background: BG_CARD,
                            color: TEXT,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        {suggestionsPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                        {suggestionsPanelOpen ? 'Ocultar painel de sugestões' : 'Mostrar painel de sugestões'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '8px 12px', borderRadius: 20, background: BG_CARD, border: `1px solid ${BORDER_PINK}`, width: 'fit-content' }}>
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isRecording ? NEON_PINK : TEXT_MUTED,
                        animation: isRecording ? 'record-dot 1.2s ease-in-out infinite' : undefined,
                    }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: isRecording ? NEON_PINK : TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isRecording ? 'Gravando' : 'Parado'}
                </span>
            </div>

            <div
                style={{
                    textAlign: 'center',
                    marginBottom: 24,
                    padding: '20px 16px',
                    borderRadius: 16,
                    background: BG_CARD,
                    border: `1px solid ${BORDER_PINK}`,
                }}
            >
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tempo de gravação</div>
                <div
                    style={{
                        fontSize: 42,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: isRecording ? '#fff' : TEXT_MUTED,
                        textShadow: isRecording ? `0 0 20px ${NEON_PINK}40` : undefined,
                        letterSpacing: '0.02em',
                    }}
                >
                    {isRecording ? formatDuration(elapsedSeconds) : '00:00'}
                </div>
            </div>

            {!isRecording && tabs.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, marginBottom: 8, color: TEXT_SECONDARY }}>
                        <Monitor size={12} />
                        Aba
                    </label>
                    <select
                        value={selectedTabId ?? tabs[0]?.id ?? ''}
                        onChange={(e) => setSelectedTabId(Number(e.target.value) || null)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: RADIUS,
                            border: `1px solid ${BORDER_PINK}`,
                            background: BG_CARD,
                            color: TEXT,
                            fontSize: 12,
                            boxSizing: 'border-box',
                        }}
                    >
                        {tabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                                {tab.title.length > 32 ? tab.title.slice(0, 32) + '…' : tab.title}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={toggleCapture}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: isRecording
                            ? `linear-gradient(135deg, ${ACCENT_DANGER}, #b91c1c)`
                            : `linear-gradient(135deg, ${NEON_PINK}, ${NEON_PINK_LIGHT})`,
                        color: 'white',
                        boxShadow: isRecording
                            ? '0 0 20px rgba(220, 38, 62, 0.5), 0 0 40px rgba(220, 38, 62, 0.2)'
                            : `0 0 24px ${NEON_PINK}50, 0 0 48px ${NEON_PINK_LIGHT}30`,
                        animation: isRecording ? 'neon-pulse-stop 2s ease-in-out infinite' : 'neon-pulse 2s ease-in-out infinite',
                        transition: 'transform 0.15s ease',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isRecording ? <Square size={28} fill="currentColor" /> : <Mic size={28} />}
                </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: TEXT_MUTED, marginTop: 12 }}>
                {isRecording ? 'Clique para parar' : 'Clique para iniciar'}
            </p>
        </div>
    );
}
