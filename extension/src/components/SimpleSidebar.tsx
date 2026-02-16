import { useEffect, useState, useRef } from 'react';
import { authService } from '../services/auth';
import { CardItem } from './CardItem';
import { type CoachCard } from '../stores/coaching-store';
import { GripVertical, Mic, Minus, LogOut, AlertCircle, X, Cpu } from 'lucide-react';
import { BG, BG_ELEVATED, BORDER, BORDER_SUBTLE, TEXT, TEXT_SECONDARY, TEXT_MUTED, INPUT_BG, INPUT_BORDER, ACCENT_ACTIVE, ACCENT_DANGER, RADIUS } from '../lib/theme';

const SIDEBAR_W = 360;
const SIDEBAR_H = '80vh';
const MIN_W = 48;
const MIN_H = 56;

/** Pega o elemento host do painel (dentro do Shadow DOM usa rootNode.host) */
function getHostFromEvent(e: React.MouseEvent): HTMLDivElement | null {
    const root = (e.target as HTMLElement).getRootNode();
    if (root && 'host' in root) return (root as ShadowRoot).host as HTMLDivElement;
    return document.getElementById('sales-copilot-root') as HTMLDivElement | null;
}

function getHost(): HTMLDivElement | null {
    return document.getElementById('sales-copilot-root') as HTMLDivElement | null;
}

export default function SimpleSidebar() {
    // Auth state
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Recording state
    const [transcripts, setTranscripts] = useState<any[]>([]);
    // Use Cards instead of single suggestion string
    const [cards, setCards] = useState<CoachCard[]>([]);
    const [managerWhisper, setManagerWhisper] = useState<{ content: string; urgency: string; timestamp: number } | null>(null);
    const [leadTemp, setLeadTemp] = useState<'hot' | 'warm' | 'cold'>('warm');
    const [isRecording, setIsRecording] = useState(false);
    const [micAvailable, setMicAvailable] = useState<boolean | null>(null);

    // Janela: minimizada + arrastar
    const [isMinimized, setIsMinimized] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0, panelW: SIDEBAR_W, panelH: 300 });

    useEffect(() => {
        const host = getHost();
        if (!host) return;
        chrome.storage.local.get(['sidebarPosition', 'sidebarMinimized'], (r: { sidebarPosition?: { left: number; top: number }; sidebarMinimized?: boolean }) => {
            const pos = r.sidebarPosition;
            const defaultLeft = Math.max(0, window.innerWidth - SIDEBAR_W - 16);
            host.style.left = (pos?.left ?? defaultLeft) + 'px';
            host.style.top = (pos?.top ?? 16) + 'px';
            const min = r.sidebarMinimized ?? false;
            setIsMinimized(min);
            host.style.width = min ? MIN_W + 'px' : SIDEBAR_W + 'px';
            host.style.height = min ? MIN_H + 'px' : SIDEBAR_H;
        });
    }, []);

    useEffect(() => {
        const host = getHost();
        if (!host) return;
        host.style.width = isMinimized ? MIN_W + 'px' : SIDEBAR_W + 'px';
        host.style.height = isMinimized ? MIN_H + 'px' : SIDEBAR_H;
        chrome.storage.local.set({ sidebarMinimized: isMinimized });
    }, [isMinimized]);

    const handleDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        const host = getHostFromEvent(e);
        if (!host) return;
        e.preventDefault();
        const w = isMinimized ? MIN_W : SIDEBAR_W;
        const leftStr = host.style.left || '';
        const topStr = host.style.top || '';
        const left = leftStr ? parseFloat(leftStr) : window.innerWidth - w - 16;
        const top = topStr ? parseFloat(topStr) : 16;
        const startLeft = Number.isNaN(left) ? 0 : Math.max(0, left);
        const startTop = Number.isNaN(top) ? 0 : Math.max(0, top);
        dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft, startTop, panelW: w, panelH: isMinimized ? MIN_H : 200 };
        const onMove = (e2: MouseEvent) => {
            const dx = e2.clientX - dragRef.current.startX;
            const dy = e2.clientY - dragRef.current.startY;
            const h = getHost();
            if (h) {
                const maxLeft = window.innerWidth - dragRef.current.panelW - 8;
                const maxTop = window.innerHeight - dragRef.current.panelH - 8;
                const newLeft = Math.max(0, Math.min(maxLeft, dragRef.current.startLeft + dx));
                const newTop = Math.max(0, Math.min(maxTop, dragRef.current.startTop + dy));
                h.style.left = newLeft + 'px';
                h.style.top = newTop + 'px';
            }
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const h = getHost();
            if (h) {
                chrome.storage.local.set({
                    sidebarPosition: {
                        left: parseFloat(h.style.left || '0') || 0,
                        top: parseFloat(h.style.top || '0') || 0
                    }
                });
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const toggleMinimize = () => setIsMinimized((p) => !p);

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

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
        setIsRecording(false);
    };

    // Listen for messages
    useEffect(() => {
        const listener = (msg: any) => {
            if (msg.type === 'TRANSCRIPT_RESULT') {
                console.log('Sidebar received transcript:', msg.data);
                const newTranscript = {
                    text: msg.data.text,
                    isFinal: msg.data.isFinal,
                    timestamp: msg.data.timestamp,
                    speaker: msg.data.speaker || 'unknown' // Add speaker property
                };
                setTranscripts(prev => [...prev, newTranscript]);

                // Mock: Update coach suggestion based on transcript
                if (msg.data.text.toLowerCase().includes('preço')) {
                    const newCard: CoachCard = {
                        id: Math.random().toString(36),
                        type: 'objection',
                        title: 'Objeção de Preço',
                        description: 'Foque no valor, não no preço. Destaque os benefícios.',
                        timestamp: Date.now(),
                        isDismissed: false
                    };
                    setCards(prev => [newCard, ...prev]);
                    setLeadTemp('warm');
                } else if (msg.data.text.toLowerCase().includes('interessante')) {
                    const newCard: CoachCard = {
                        id: Math.random().toString(36),
                        type: 'signal',
                        title: 'Sinal de Compra',
                        description: 'Lead engajado! Pergunte sobre o timeline de decisão.',
                        timestamp: Date.now(),
                        isDismissed: false
                    };
                    setCards(prev => [newCard, ...prev]);
                    setLeadTemp('hot');
                } else if (msg.data.text.toLowerCase().includes('não')) {
                    const newCard: CoachCard = {
                        id: Math.random().toString(36),
                        type: 'alert',
                        title: 'Possível Objeção',
                        description: 'Faça perguntas abertas para entender.',
                        timestamp: Date.now(),
                        isDismissed: false
                    };
                    setCards(prev => [newCard, ...prev]);
                    setLeadTemp('cold');
                }
            } else if (msg.type === 'STATUS_UPDATE') {
                setIsRecording(msg.status === 'RECORDING');
                if (msg.status === 'RECORDING' && typeof msg.micAvailable === 'boolean') {
                    setMicAvailable(msg.micAvailable);
                }
                if (msg.status !== 'RECORDING') setMicAvailable(null);

                if (msg.status === 'PERMISSION_REQUIRED') {
                    alert('Permissão necessária. Clique no ícone da extensão na barra do navegador para autorizar a captura da aba.');
                }
            } else if (msg.type === 'MANAGER_WHISPER') {
                // Handle new whisper
                setManagerWhisper({
                    content: msg.data.content,
                    urgency: msg.data.urgency,
                    timestamp: msg.data.timestamp
                });
            } else if (msg.type === 'COACHING_MESSAGE') {
                // Handle AI coaching from backend → Create a Card
                const payload = msg.data;
                const isObjection = payload.type === 'objection' && payload.metadata?.objection;
                const phase = payload.metadata?.phase || null;

                const phaseLabels: Record<string, string> = {
                    S: 'Situação', P: 'Problema', I: 'Implicação', N: 'Necessidade'
                };

                const newCard: CoachCard = {
                    id: Math.random().toString(36).substring(7),
                    type: isObjection ? 'objection' : 'tip',
                    title: isObjection
                        ? 'Objeção Detectada'
                        : `${phase ? phaseLabels[phase] || 'SPIN' : 'Dica'} — Próximo Passo`,
                    description: payload.content,
                    timestamp: Date.now(),
                    isDismissed: false,
                    metadata: {
                        ...payload.metadata,
                        urgency: payload.urgency
                    }
                };

                setCards(prev => [newCard, ...prev].slice(0, 10));
                if (isObjection || payload.urgency === 'high') setLeadTemp('hot');
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const baseContainer = {
        width: '100%',
        minHeight: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: TEXT,
    };

    if (loading) {
        return (
            <div style={{ ...baseContainer, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: TEXT_SECONDARY, fontSize: 13 }}>Carregando...</span>
            </div>
        );
    }

    if (!session) {
        return (
            <div style={{ ...baseContainer, height: '100%', padding: 24 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: TEXT }}>Entrar</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, marginBottom: 6, color: TEXT_SECONDARY }}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: RADIUS, border: `1px solid ${INPUT_BORDER}`, background: INPUT_BG, color: TEXT, fontSize: 13 }} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, marginBottom: 6, color: TEXT_SECONDARY }}>Senha</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: RADIUS, border: `1px solid ${INPUT_BORDER}`, background: INPUT_BG, color: TEXT, fontSize: 13 }} required />
                    </div>
                    {error && <p style={{ color: ACCENT_DANGER, fontSize: 12 }}>{error}</p>}
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, borderRadius: RADIUS, border: 'none', background: ACCENT_ACTIVE, color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        );
    }

    if (isMinimized) {
        return (
            <div
                onMouseDown={handleDragStart}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    borderRight: `1px solid ${BORDER}`,
                    cursor: 'move',
                    userSelect: 'none',
                }}
            >
                <button onClick={toggleMinimize} title="Expandir" style={{ width: 32, height: 32, borderRadius: RADIUS, border: `1px solid ${BORDER}`, background: BG_ELEVATED, color: TEXT_SECONDARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GripVertical size={16} style={{ transform: 'rotate(-90deg)' }} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ ...baseContainer, height: '100%' }}>
            <div
                onMouseDown={handleDragStart}
                style={{ padding: 12, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'move', userSelect: 'none', flexShrink: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GripVertical size={14} style={{ color: TEXT_MUTED }} />
                    <Mic size={16} style={{ color: isRecording ? ACCENT_DANGER : TEXT_MUTED }} />
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY }}>{isRecording ? 'Gravando' : 'Parado'}</div>
                        <div style={{ fontSize: 10, color: TEXT_MUTED }}>{session.user?.email}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={toggleMinimize} title="Minimizar" style={{ padding: 6, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: RADIUS, color: TEXT_SECONDARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={14} />
                    </button>
                    <button onClick={handleLogout} style={{ padding: 6, fontSize: 11, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: RADIUS, color: TEXT_SECONDARY, cursor: 'pointer' }}>Sair</button>
                </div>
            </div>

            {managerWhisper && (
                <div style={{ padding: 12, background: BG_ELEVATED, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Gestor</span>
                        <button onClick={() => setManagerWhisper(null)} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <X size={14} />
                        </button>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: TEXT }}>{managerWhisper.content}</div>
                </div>
            )}

            <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', padding: '12px 12px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: BG }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Insights</div>
                {cards.length === 0 ? (
                    <div style={{ fontSize: 12, color: TEXT_MUTED, paddingBottom: 12 }}>Aguardando análise...</div>
                ) : (
                    cards.map((card) => (
                        <div key={card.id} style={{ flexShrink: 0 }}>
                            <CardItem card={card} onDismiss={(id) => setCards((prev) => prev.filter((c) => c.id !== id))} />
                        </div>
                    ))
                )}
            </div>

            <div style={{ padding: '10px 12px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', backgroundColor: BG_ELEVATED, border: `1px solid ${BORDER}`, borderRadius: RADIUS, fontSize: 11, color: TEXT_SECONDARY }}>
                    <Cpu size={12} />
                    Analisando em tempo real
                </div>
            </div>
        </div>
    );
}
