'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    ThumbsUp,
    ThumbsDown,
    Activity,
    FileText,
    CheckCircle2,
    AlertCircle,
    BrainCircuit,
    ChevronDown,
    ChevronUp,
    Play,
    Zap,
    Target,
    MessageSquare
} from 'lucide-react';

const NEON_PINK = '#ff007a';
const NEON_GREEN = '#00ff94';
const NEON_ORANGE = '#ff8a00';
const CARD_BG = '#1e1e1e';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

interface Call {
    id: string;
    user_id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    platform: string;
    started_at: string;
    ended_at?: string;
    duration_seconds?: number;
    transcript?: any[];
    lead_profile?: any;
    user?: {
        full_name: string;
        email: string;
    };
    script?: {
        name: string;
    };
    summary?: CallSummary;
}

interface CallSummary {
    id: string;
    script_adherence_score?: number;
    strengths?: string[];
    improvements?: string[];
    objections_faced?: any[];
    buying_signals?: string[];
    lead_sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
    result?: 'CONVERTED' | 'FOLLOW_UP' | 'LOST' | 'UNKNOWN';
    next_steps?: string[];
    ai_notes?: string;
}

interface Objection {
    id: string;
    trigger_phrase: string;
    coaching_tip: string;
    detected_at?: string;
    timestamp_ms?: number;
}

interface UserProfile {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'SELLER';
    organization_id: string;
}

export default function CallDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [call, setCall] = useState<Call | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTranscript, setShowTranscript] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [objections, setObjections] = useState<Objection[]>([]);

    const supabase = createClient();
    const callId = params.id as string;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !callId) return;

        async function loadData() {
            try {
                setLoading(true);

                // 1. Get current user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (authError || !authUser) throw new Error('Not authenticated');

                // 2. Get user profile for RBAC
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                const profileData = profile as { role?: string } | null;
                setCurrentUser(profile as any);

                // 3. Get Call Data with Relations — use full_name instead of name
                const { data: callData, error: callError } = await supabase
                    .from('calls')
                    .select(`
                        *,
                        user:profiles!user_id(full_name),
                        script:scripts!calls_script_relationship(name),
                        summary:call_summaries(*)
                    `)
                    .eq('id', callId)
                    .single();

                if (callError) throw callError;
                if (!callData) throw new Error('Call not found');

                // 4. Apply RBAC
                const callResult = callData as any;
                const isOwner = callResult.user_id === authUser.id;
                const isManager = profileData ? ['ADMIN', 'MANAGER'].includes(profileData.role ?? '') : false;

                if (!isOwner && !isManager) {
                    throw new Error('Unauthorized access');
                }

                // Compute duration_seconds if missing
                if (!callResult.duration_seconds && callResult.started_at && callResult.ended_at) {
                    const start = new Date(callResult.started_at).getTime();
                    const end = new Date(callResult.ended_at).getTime();
                    callResult.duration_seconds = Math.round((end - start) / 1000);
                }

                const summary = Array.isArray(callResult.summary) ? callResult.summary[0] : callResult.summary;
                setCall({ ...callResult, summary });

                // 5. Fetch objections for this call (if table exists)
                try {
                    const { data: objData } = await supabase
                        .from('objection_success_metrics')
                        .select('id, objection_id, detected_at, objection:objections(trigger_phrase, coaching_tip)')
                        .eq('call_id', callId)
                        .order('detected_at', { ascending: true });

                    if (objData) {
                        setObjections((objData as any[]).map(o => ({
                            id: o.id,
                            trigger_phrase: o.objection?.trigger_phrase || 'Objeção',
                            coaching_tip: o.objection?.coaching_tip || '',
                            detected_at: o.detected_at,
                        })));
                    }
                } catch {
                    // Table may not exist yet — non-fatal
                }

            } catch (err: any) {
                console.error('Error loading call:', err);
                const msg = err?.message ?? '';
                if (msg.includes('Unauthorized') || err?.code === 'PGRST116' || msg.toLowerCase().includes('not found')) {
                    setError('Chamada não encontrada ou você não tem permissão para visualizá-la.');
                } else {
                    setError(msg || 'Não foi possível carregar os detalhes da chamada.');
                }
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [mounted, callId]);

    if (!mounted || loading) {
        return (
            <div className="flex items-center justify-center p-12" suppressHydrationWarning={true}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Carregando inteligência da call...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                </div>
            </div>
        );
    }

    if (!call) return null;

    const isProcessing = call.status === 'COMPLETED' && !call.summary;

    const handleUpdateOutcome = async (outcome: 'CONVERTED' | 'LOST') => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/calls/${callId}/outcome`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ outcome })
            });

            if (!response.ok) throw new Error('Failed to update outcome');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar resultado da chamada');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) {
            // Fallback: compute from timestamps
            if (call.started_at && call.ended_at) {
                const diff = Math.floor((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000);
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                return `${mins}m ${secs}s`;
            }
            return 'N/A';
        }
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'POSITIVE': return 'text-green-400 bg-green-900/30 border-green-500/30';
            case 'NEGATIVE': return 'text-red-400 bg-red-900/30 border-red-500/30';
            case 'MIXED': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
            default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
        }
    };

    const getSentimentIcon = (sentiment?: string) => {
        switch (sentiment) {
            case 'POSITIVE': return <ThumbsUp className="w-6 h-6" />;
            case 'NEGATIVE': return <ThumbsDown className="w-6 h-6" />;
            case 'MIXED': return <Activity className="w-6 h-6" />;
            default: return <Activity className="w-6 h-6" />;
        }
    };

    const formatTimestamp = (ts?: string | number) => {
        if (!ts) return '';
        try {
            const d = new Date(ts);
            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch { return ''; }
    };

    const resultLabel: Record<string, string> = {
        CONVERTED: 'Venda realizada',
        LOST: 'Venda perdida',
        FOLLOW_UP: 'Em follow-up',
        UNKNOWN: 'A definir',
    };
    const resultColor = call.summary?.result === 'CONVERTED' ? 'bg-green-500/20 border-green-400/50 text-green-300' : call.summary?.result === 'LOST' ? 'bg-red-500/20 border-red-400/50 text-red-300' : 'bg-amber-500/20 border-amber-400/50 text-amber-300';

    return (
        <div className="space-y-6 max-w-6xl mx-auto" suppressHydrationWarning={true}>
            <DashboardHeader title="Raio X da Venda" />
            <Link
                href="/calls"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar para Chamadas
            </Link>

            {/* Contexto da chamada */}
            <div className="rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                <span className="flex items-center gap-2 text-white font-medium">
                    <User className="w-4 h-4 text-gray-400" /> {call.user?.full_name ?? call.lead_profile?.name ?? 'Lead'}
                </span>
                <span className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" /> {formatDuration(call.duration_seconds)}
                </span>
                <span className="flex items-center gap-2 text-gray-400" suppressHydrationWarning={true}>
                    <Calendar className="w-4 h-4" /> {new Date(call.started_at).toLocaleDateString('pt-BR')}
                </span>

                {objections.length > 0 && (
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: NEON_ORANGE }}>
                        <Zap className="w-4 h-4" /> {objections.length} objeç{objections.length === 1 ? 'ão' : 'ões'}
                    </span>
                )}

            </div>

            {/* Faixa de resultado (quando já tem summary) */}
            {call.summary?.result && !isProcessing && (
                <div className={`rounded-2xl border-2 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 ${resultColor}`}>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Resultado</span>
                        <span className="text-xl sm:text-2xl font-bold">{resultLabel[call.summary.result] ?? call.summary.result}</span>
                    </div>
                    <div className="flex items-center gap-6 sm:gap-8">
                        <div className="text-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sentimento</div>
                            <div className="text-lg font-bold mt-0.5">{call.summary?.lead_sentiment || 'NEUTRAL'}</div>
                        </div>
                        {call.summary?.script_adherence_score !== undefined && (
                            <div className="text-center">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Aderência ao script</div>
                                <div className="text-2xl font-bold mt-0.5 text-white">{call.summary.script_adherence_score}%</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Intelligence Grid */}
            {isProcessing ? (
                <div className="rounded-2xl border-2 border-blue-500/30 p-12 text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
                    <BrainCircuit className="w-16 h-16 mx-auto mb-6 text-blue-400 animate-pulse" />
                    <h3 className="text-xl font-bold text-white">Processando Inteligência...</h3>
                    <p className="mt-3 text-blue-300 max-w-md mx-auto">Nossa IA está analisando a conversa para gerar seus insights. Esta página será atualizada automaticamente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna esquerda */}
                    <div className="space-y-6">
                        {/* Termômetro (quando não mostrado na faixa) */}
                        {call.summary && (call.summary.lead_sentiment || call.summary.script_adherence_score !== undefined) && (
                            <Card className="rounded-2xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                        <Target className="w-5 h-5" style={{ color: NEON_PINK }} />
                                        Termômetro da Lead
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`flex items-center justify-between p-5 rounded-xl border-2 ${getSentimentColor(call.summary?.lead_sentiment)}`}>
                                        <div className="flex items-center gap-4">
                                            {getSentimentIcon(call.summary?.lead_sentiment)}
                                            <span className="font-bold text-xl text-white">{call.summary?.lead_sentiment || 'NEUTRAL'}</span>
                                        </div>
                                        {call.summary?.script_adherence_score !== undefined && (
                                            <div className="text-right">
                                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aderência</div>
                                                <div className="font-bold text-2xl text-white">{call.summary.script_adherence_score}%</div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Resumo da IA */}
                        <Card className="rounded-2xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" style={{ color: NEON_PINK }} />
                                    Resumo da IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
                                {call.summary?.ai_notes || "Nenhum resumo gerado ainda."}
                            </CardContent>
                        </Card>

                        {/* Objeções */}
                        {objections.length > 0 && (
                            <Card className="rounded-2xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5" style={{ color: NEON_ORANGE }} />
                                        Objeções Detectadas ({objections.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {objections.map((obj, i) => (
                                            <div key={obj.id || i} className="flex gap-4 items-start p-4 rounded-xl bg-black/20 border border-white/5">
                                                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: 'rgba(255, 138, 0, 0.2)' }}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-white">{obj.trigger_phrase}</div>
                                                    {obj.coaching_tip && (
                                                        <div className="text-sm text-gray-400 mt-1">{obj.coaching_tip}</div>
                                                    )}
                                                    {obj.detected_at && (
                                                        <div className="text-xs text-gray-500 mt-2" suppressHydrationWarning={true}>
                                                            {formatTimestamp(obj.detected_at)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Próximos Passos */}
                        <Card className="rounded-2xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" style={{ color: NEON_GREEN }} />
                                    Próximos Passos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {call.summary?.next_steps?.length ? (
                                        call.summary.next_steps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-3 text-base text-gray-300 p-3 rounded-lg bg-white/5 border border-white/5">
                                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: NEON_GREEN }} />
                                                <span>{step}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-500 text-sm italic">Nenhum próximo passo detectado.</li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna direita: Pontos de Ouro */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border shadow-none min-h-[280px]" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                    <Activity className="w-6 h-6" style={{ color: NEON_ORANGE }} />
                                    Pontos de Ouro
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-sm">O que funcionou e onde podemos melhorar</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-400">
                                        <ThumbsUp className="w-5 h-5" /> Acertos
                                    </h4>
                                    <ul className="space-y-3">
                                        {call.summary?.strengths?.length ? (
                                            call.summary.strengths.map((str, i) => (
                                                <li key={i} className="flex gap-3 text-base p-4 rounded-xl bg-green-900/20 text-green-200 border border-green-500/20">
                                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                                                    {str}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Nenhum ponto forte detectado.</p>
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-400">
                                        <AlertCircle className="w-5 h-5" /> Melhorias
                                    </h4>
                                    <ul className="space-y-3">
                                        {call.summary?.improvements?.length ? (
                                            call.summary.improvements.map((imp, i) => (
                                                <li key={i} className="flex gap-3 text-base p-4 rounded-xl bg-amber-900/20 text-amber-200 border border-amber-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                    {imp}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Nenhum ponto de melhoria detectado.</p>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Transcrição (expansível) */}
            <Card className="rounded-2xl border shadow-none overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                <button
                    type="button"
                    className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b text-left"
                    style={{ borderColor: CARD_BORDER }}
                    onClick={() => setShowTranscript(!showTranscript)}
                >
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" style={{ color: NEON_PINK }} /> Transcrição Completa
                    </h3>
                    <span className="text-gray-400">
                        {showTranscript ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                </button>
                {showTranscript && (
                    <CardContent className="p-0">
                        <div className="max-h-[420px] overflow-y-auto p-5 space-y-4 bg-black/20">
                            {call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0 ? (
                                call.transcript.map((entry: any, idx: number) => (
                                    <div key={idx} className={`flex gap-4 ${entry.role === 'seller' ? 'flex-row-reverse' : ''}`}>
                                        <div
                                            className={`flex-1 p-4 rounded-xl text-base ${entry.role === 'seller'
                                                ? 'text-white rounded-tr-none'
                                                : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                                }`}
                                            style={entry.role === 'seller' ? { backgroundColor: 'rgba(255, 0, 122, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 0, 122, 0.3)' } : undefined}
                                        >
                                            <div className="text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                                                {entry.speaker || (entry.role === 'seller' ? 'Vendedor' : 'Lead')}
                                            </div>
                                            {entry.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-12">Transcrição não disponível.</p>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
