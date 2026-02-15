'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
    Zap
} from 'lucide-react';

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
                setError(err.message || 'Failed to load call details');
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

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto" suppressHydrationWarning={true}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent text-gray-400" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Calls
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Raio-X da Venda</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1" suppressHydrationWarning={true}>
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {call.user?.full_name ?? call.lead_profile?.name ?? 'Lead'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {formatDuration(call.duration_seconds)}
                        </span>
                        <span className="flex items-center gap-1" suppressHydrationWarning={true}>
                            <Calendar className="w-4 h-4" /> {new Date(call.started_at).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge variant="outline" className="border-white/10 text-gray-400">{call.script?.name || 'Sem Script'}</Badge>
                        {objections.length > 0 && (
                            <span className="flex items-center gap-1 text-orange-400">
                                <Zap className="w-4 h-4" /> {objections.length} objeç{objections.length === 1 ? 'ão' : 'ões'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {(!call.summary?.result || call.summary.result === 'UNKNOWN' || call.summary.result === 'FOLLOW_UP') && (
                        <>
                            <Button
                                variant="outline"
                                className="border-green-500/30 text-green-400 hover:bg-green-900/20"
                                onClick={() => handleUpdateOutcome('CONVERTED')}
                                disabled={loading}
                            >
                                <ThumbsUp className="w-4 h-4 mr-2" /> Venda Realizada
                            </Button>
                            <Button
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                                onClick={() => handleUpdateOutcome('LOST')}
                                disabled={loading}
                            >
                                <ThumbsDown className="w-4 h-4 mr-2" /> Venda Perdida
                            </Button>
                        </>
                    )}

                    {currentUser && ['ADMIN', 'MANAGER'].includes(currentUser.role) && (
                        <Button variant="outline" disabled className="border-white/10 text-gray-500">
                            <Play className="w-4 h-4 mr-2" /> Gravação
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Intelligence Grid */}
            {isProcessing ? (
                <Card className="border-blue-500/20 bg-blue-900/10">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-blue-300">
                        <BrainCircuit className="w-12 h-12 mb-4 animate-pulse" />
                        <h3 className="text-lg font-semibold">Processando Inteligência...</h3>
                        <p className="mt-2 text-blue-400">Nossa IA está analisando a conversa para gerar seus insights.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Thermometer */}
                        <Card className="bg-[#1e1e1e] border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Termômetro da Lead
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`flex items-center justify-between p-4 rounded-lg border ${getSentimentColor(call.summary?.lead_sentiment)}`}>
                                    <div className="flex items-center gap-3">
                                        {getSentimentIcon(call.summary?.lead_sentiment)}
                                        <span className="font-bold text-lg">{call.summary?.lead_sentiment || 'NEUTRAL'}</span>
                                    </div>
                                    {call.summary?.script_adherence_score !== undefined && (
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase">Aderência</div>
                                            <div className="font-bold text-xl text-white">{call.summary.script_adherence_score}%</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Context / Summary */}
                        <Card className="bg-[#1e1e1e] border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    Resumo da IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                                {call.summary?.ai_notes || "Nenhum resumo gerado ainda."}
                            </CardContent>
                        </Card>

                        {/* Objections Timeline */}
                        {objections.length > 0 && (
                            <Card className="bg-[#1e1e1e] border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Zap className="w-5 h-5 text-orange-400" />
                                        Objeções Detectadas ({objections.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {objections.map((obj, i) => (
                                            <div key={obj.id || i} className="flex gap-3 items-start">
                                                <div className="shrink-0 mt-1">
                                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-bold text-orange-400">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-orange-300">{obj.trigger_phrase}</div>
                                                    {obj.coaching_tip && (
                                                        <div className="text-xs text-gray-500 mt-0.5">{obj.coaching_tip}</div>
                                                    )}
                                                    {obj.detected_at && (
                                                        <div className="text-[10px] text-gray-600 mt-1" suppressHydrationWarning={true}>
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

                        {/* Next Steps */}
                        <Card className="bg-[#1e1e1e] border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    Próximos Passos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {call.summary?.next_steps?.length ? (
                                        call.summary.next_steps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                                {step}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-500 text-sm italic">Nenhum próximo passo detectado.</li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Pontos de Ouro */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="h-full bg-[#1e1e1e] border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Activity className="w-5 h-5 text-amber-400" />
                                    Pontos de Ouro
                                </CardTitle>
                                <CardDescription className="text-gray-500">O que funcionou e onde podemos melhorar</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                {/* Strengths */}
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                                        <ThumbsUp className="w-4 h-4" /> Acertos
                                    </h4>
                                    <ul className="space-y-3">
                                        {call.summary?.strengths?.length ? (
                                            call.summary.strengths.map((str, i) => (
                                                <li key={i} className="flex gap-3 text-sm bg-green-900/20 p-3 rounded-md text-green-300 border border-green-500/10">
                                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                    {str}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Nenhum ponto forte detectado.</p>
                                        )}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div>
                                    <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Melhorias
                                    </h4>
                                    <ul className="space-y-3">
                                        {call.summary?.improvements?.length ? (
                                            call.summary.improvements.map((imp, i) => (
                                                <li key={i} className="flex gap-3 text-sm bg-red-900/20 p-3 rounded-md text-red-300 border border-red-500/10">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
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

            {/* Transcript Section (Collapsible) */}
            <Card className="bg-[#1e1e1e] border-white/5">
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/5"
                    onClick={() => setShowTranscript(!showTranscript)}
                >
                    <h3 className="font-semibold flex items-center gap-2 text-white">
                        <FileText className="w-4 h-4" /> Transcrição Completa
                    </h3>
                    <Button variant="ghost" size="sm" className="text-gray-400">
                        {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>

                {showTranscript && (
                    <CardContent className="p-0">
                        <div className="max-h-96 overflow-y-auto p-4 space-y-4 bg-black/20">
                            {call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0 ? (
                                call.transcript.map((entry: any, idx: number) => (
                                    <div key={idx} className={`flex gap-4 ${entry.role === 'seller' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex-1 p-3 rounded-lg text-sm ${entry.role === 'seller'
                                            ? 'bg-neon-pink/10 border border-neon-pink/20 text-white rounded-tr-none'
                                            : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                            }`}>
                                            <div className="font-xs font-semibold mb-1 opacity-70 text-gray-400">
                                                {entry.speaker || (entry.role === 'seller' ? 'Vendedor' : 'Lead')}
                                            </div>
                                            {entry.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">Transcrição não disponível.</p>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
