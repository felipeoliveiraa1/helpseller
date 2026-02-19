'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    User,
    ThumbsUp,
    ThumbsDown,
    Activity,
    CheckCircle2,
    AlertCircle,
    BrainCircuit,
    Zap,
    Target,
    MessageSquare,
} from 'lucide-react';

const NEON_PINK = '#ff007a';
const NEON_GREEN = '#00ff94';
const NEON_ORANGE = '#ff8a00';
const CARD_BG = '#1e1e1e';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

export interface CallSummaryForRaioX {
    id?: string;
    script_adherence_score?: number;
    strengths?: string[];
    improvements?: string[];
    objections_faced?: unknown[];
    buying_signals?: string[];
    lead_sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
    result?: 'CONVERTED' | 'FOLLOW_UP' | 'LOST' | 'UNKNOWN';
    next_steps?: string[];
    ai_notes?: string;
}

export interface CallForRaioX {
    id: string;
    user_id: string;
    status: string;
    started_at: string;
    ended_at?: string;
    duration_seconds?: number;
    user?: { full_name?: string };
    lead_profile?: { name?: string };
    script?: { name?: string };
    summary?: CallSummaryForRaioX;
}

export interface ObjectionForRaioX {
    id: string;
    trigger_phrase: string;
    coaching_tip: string;
    detected_at?: string;
}

interface CallRaioXPanelProps {
    call: CallForRaioX | null;
    objections: ObjectionForRaioX[];
    loading: boolean;
    error: string | null;
}

function formatDuration(seconds?: number, startedAt?: string, endedAt?: string): string {
    if (seconds != null) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }
    if (startedAt && endedAt) {
        const diff = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    }
    return 'N/A';
}

function getSentimentColor(sentiment?: string): string {
    switch (sentiment) {
        case 'POSITIVE': return 'text-green-400 bg-green-900/30 border-green-500/30';
        case 'NEGATIVE': return 'text-red-400 bg-red-900/30 border-red-500/30';
        case 'MIXED': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
        default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
    }
}

function getSentimentIcon(sentiment?: string) {
    switch (sentiment) {
        case 'POSITIVE': return <ThumbsUp className="w-6 h-6" />;
        case 'NEGATIVE': return <ThumbsDown className="w-6 h-6" />;
        case 'MIXED': return <Activity className="w-6 h-6" />;
        default: return <Activity className="w-6 h-6" />;
    }
}

function formatTimestamp(ts?: string | number): string {
    if (!ts) return '';
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
}

const RESULT_LABEL: Record<string, string> = {
    CONVERTED: 'Venda realizada',
    LOST: 'Venda perdida',
    FOLLOW_UP: 'Em follow-up',
    UNKNOWN: 'A definir',
};

export function CallRaioXPanel({ call, objections, loading, error }: CallRaioXPanelProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff007a]" />
                <span className="ml-2 mt-3 text-sm text-gray-400">Carregando Raio X...</span>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-6">
                <p className="text-sm text-red-300 text-center">{error}</p>
            </div>
        );
    }
    if (!call) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-gray-500">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-600" style={{ color: NEON_PINK }} />
                <p className="text-sm font-medium text-white mb-1">Raio X da Venda</p>
                <p className="text-sm">Clique em uma chamada na lista para ver o Raio X</p>
            </div>
        );
    }

    const isProcessing = call.status === 'COMPLETED' && !call.summary;
    const resultColor = call.summary?.result === 'CONVERTED'
        ? 'bg-green-500/20 border-green-400/50 text-green-300'
        : call.summary?.result === 'LOST'
            ? 'bg-red-500/20 border-red-400/50 text-red-300'
            : 'bg-amber-500/20 border-amber-400/50 text-amber-300';

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-dark">
            <div className="rounded-xl border p-3 sm:p-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm shrink-0" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                <span className="flex items-center gap-2 text-white font-medium">
                    <User className="w-4 h-4 text-gray-400" /> {call.user?.full_name ?? call.lead_profile?.name ?? 'Lead'}
                </span>
                <span className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" /> {formatDuration(call.duration_seconds, call.started_at, call.ended_at)}
                </span>
                <span className="flex items-center gap-2 text-gray-400" suppressHydrationWarning>
                    <Calendar className="w-4 h-4" /> {new Date(call.started_at).toLocaleDateString('pt-BR')}
                </span>
                {objections.length > 0 && (
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: NEON_ORANGE }}>
                        <Zap className="w-4 h-4" /> {objections.length} objeç{objections.length === 1 ? 'ão' : 'ões'}
                    </span>
                )}
            </div>

            {call.summary?.result && !isProcessing && (
                <div className={`rounded-xl border-2 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 ${resultColor}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Resultado</span>
                        <span className="text-lg sm:text-xl font-bold">{RESULT_LABEL[call.summary.result] ?? call.summary.result}</span>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sentimento</div>
                            <div className="text-base font-bold mt-0.5">{call.summary?.lead_sentiment || 'NEUTRAL'}</div>
                        </div>
                        {call.summary?.script_adherence_score !== undefined && (
                            <div className="text-center">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Aderência</div>
                                <div className="text-xl font-bold mt-0.5 text-white">{call.summary.script_adherence_score}%</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isProcessing ? (
                <div className="rounded-xl border-2 border-blue-500/30 p-8 text-center shrink-0" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
                    <BrainCircuit className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-pulse" />
                    <h3 className="text-base font-bold text-white">Processando Inteligência...</h3>
                    <p className="mt-2 text-blue-300 text-sm">A IA está analisando a conversa.</p>
                    <p className="mt-2 text-gray-500 text-xs">Pode levar até 1 minuto. A página atualiza sozinha.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                    <div className="space-y-4">
                        {call.summary && (call.summary.lead_sentiment || call.summary.script_adherence_score !== undefined) && (
                            <Card className="rounded-xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                                <CardHeader className="pb-1 pt-3 px-4">
                                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                        <Target className="w-4 h-4" style={{ color: NEON_PINK }} />
                                        Termômetro da Lead
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${getSentimentColor(call.summary?.lead_sentiment)}`}>
                                        <div className="flex items-center gap-2">
                                            {getSentimentIcon(call.summary?.lead_sentiment)}
                                            <span className="font-bold text-base text-white">{call.summary?.lead_sentiment || 'NEUTRAL'}</span>
                                        </div>
                                        {call.summary?.script_adherence_score !== undefined && (
                                            <div className="text-right">
                                                <div className="text-[10px] font-semibold text-gray-400 uppercase">Aderência</div>
                                                <div className="font-bold text-xl text-white">{call.summary.script_adherence_score}%</div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="rounded-xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" style={{ color: NEON_PINK }} />
                                    Resumo da IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                                {call.summary?.ai_notes || 'Nenhum resumo gerado ainda.'}
                            </CardContent>
                        </Card>

                        {objections.length > 0 && (
                            <Card className="rounded-xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                                <CardHeader className="pb-1 pt-3 px-4">
                                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                        <Zap className="w-4 h-4" style={{ color: NEON_ORANGE }} />
                                        Objeções ({objections.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <div className="space-y-3">
                                        {objections.map((obj, i) => (
                                            <div key={obj.id || i} className="flex gap-3 items-start p-3 rounded-lg bg-black/20 border border-white/5">
                                                <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'rgba(255, 138, 0, 0.2)' }}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-white text-sm">{obj.trigger_phrase}</div>
                                                    {obj.coaching_tip && <div className="text-xs text-gray-400 mt-0.5">{obj.coaching_tip}</div>}
                                                    {obj.detected_at && (
                                                        <div className="text-[10px] text-gray-500 mt-1" suppressHydrationWarning>{formatTimestamp(obj.detected_at)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="rounded-xl border shadow-none" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" style={{ color: NEON_GREEN }} />
                                    Próximos Passos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <ul className="space-y-2">
                                    {call.summary?.next_steps?.length ? (
                                        call.summary.next_steps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300 p-2 rounded-lg bg-white/5 border border-white/5">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: NEON_GREEN }} />
                                                <span>{step}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-500 text-xs italic">Nenhum próximo passo detectado.</li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <Card className="rounded-xl border shadow-none min-h-[200px]" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5" style={{ color: NEON_ORANGE }} />
                                    Pontos de Ouro
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-xs">O que funcionou e onde melhorar</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4 px-4 pb-4">
                                <div>
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-green-400">
                                        <ThumbsUp className="w-4 h-4" /> Acertos
                                    </h4>
                                    <ul className="space-y-2">
                                        {call.summary?.strengths?.length ? (
                                            call.summary.strengths.map((str, i) => (
                                                <li key={i} className="flex gap-2 text-sm p-3 rounded-lg bg-green-900/20 text-green-200 border border-green-500/20">
                                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
                                                    {str}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-xs italic">Nenhum ponto forte detectado.</p>
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-amber-400">
                                        <AlertCircle className="w-4 h-4" /> Melhorias
                                    </h4>
                                    <ul className="space-y-2">
                                        {call.summary?.improvements?.length ? (
                                            call.summary.improvements.map((imp, i) => (
                                                <li key={i} className="flex gap-2 text-sm p-3 rounded-lg bg-amber-900/20 text-amber-200 border border-amber-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                    {imp}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-xs italic">Nenhum ponto de melhoria detectado.</p>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
