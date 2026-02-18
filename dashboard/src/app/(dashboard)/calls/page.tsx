'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Clock, Filter, Zap, ExternalLink } from 'lucide-react';

const NEON_PINK = '#ff007a';
const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' };

interface Call {
    id: string;
    user_id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    platform: string;
    started_at: string;
    ended_at?: string;
    transcript?: Array<{ speaker?: string; role?: string; text?: string }>;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
    script?: {
        name: string;
    };
    summary?: {
        lead_sentiment?: string;
        result?: string;
    };
    objectionCount?: number;
}

interface TeamMember {
    id: string;
    full_name: string;
}

export default function CallsPage() {
    const [mounted, setMounted] = useState(false);
    const [calls, setCalls] = useState<Call[]>([]);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);

    // Filters
    const [userRole, setUserRole] = useState<string>('SELLER');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedSeller, setSelectedSeller] = useState<string>('all');
    const [callsLoadError, setCallsLoadError] = useState<boolean>(false);

    const transcriptScrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Fetch user role, org, team members
    useEffect(() => {
        setMounted(true);

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setCurrentUserId(user.id);

            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, organization_id')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    setUserRole('SELLER');
                    setOrgId(null);
                    return;
                }

                const role = (profile as any)?.role || 'SELLER';
                const org = (profile as any)?.organization_id || null;
                setUserRole(role);
                setOrgId(org);

                if (role !== 'SELLER' && org) {
                    const { data: members } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .eq('organization_id', org)
                        .order('full_name');
                    setTeamMembers(((members as any[]) || []).map((m) => ({ id: m.id, full_name: (m as any).full_name ?? 'Sem nome' })));
                }
            } catch {
                setUserRole('SELLER');
                setOrgId(null);
            }
        };

        init();
    }, []);

    // Fetch calls whenever filter changes; poll more often when a live call is selected (transcript updates)
    const selectedId = selectedCall?.id ?? '';
    const selectedStatus = selectedCall?.status ?? '';
    useEffect(() => {
        if (!mounted) return;
        fetchCalls();
        const ms = selectedStatus === 'ACTIVE' ? 2500 : 8000;
        const interval = setInterval(fetchCalls, ms);
        return () => clearInterval(interval);
    }, [mounted, selectedSeller, currentUserId, orgId, userRole, selectedId, selectedStatus]);

    // Keep selected call in sync with refetched data so transcript updates in real time
    useEffect(() => {
        if (!selectedCall?.id || calls.length === 0) return;
        const updated = calls.find((c) => c.id === selectedCall.id);
        if (updated) setSelectedCall(updated);
    }, [calls]);

    // Auto-scroll transcript to bottom when new entries arrive
    const transcriptLength = Array.isArray(selectedCall?.transcript) ? selectedCall.transcript.length : 0;
    useEffect(() => {
        const el = transcriptScrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [transcriptLength]);

    const fetchCalls = async () => {
        if (!currentUserId) return;

        const fullSelect = `
            *,
            user:profiles!user_id(full_name, avatar_url),
            script:scripts!calls_script_relationship(name),
            summary:call_summaries(lead_sentiment, result)
        `;

        try {
            let q = supabase
                .from('calls')
                .select(fullSelect)
                .neq('status', 'ACTIVE') // Filter out active calls
                .order('started_at', { ascending: false })
                .limit(50);

            if (userRole === 'SELLER') {
                q = q.eq('user_id', currentUserId);
            } else {
                if (orgId) q = q.eq('organization_id', orgId);
                if (selectedSeller !== 'all') q = q.eq('user_id', selectedSeller);
            }

            const { data, error } = await q;

            if (error) throw error;

            setCallsLoadError(false);
            setCalls(
                (data as any[] || []).map((c: any) => ({
                    ...c,
                    user: c.user,
                    summary: Array.isArray(c.summary) ? c.summary[0] : c.summary,
                }))
            );
        } catch (error) {
            console.error('Error fetching calls:', error);
            // Fallback: fetch without joins if types/relationships are failing
            try {
                let q = supabase
                    .from('calls')
                    .select('*')
                    .neq('status', 'ACTIVE')
                    .order('started_at', { ascending: false })
                    .limit(50);

                if (userRole === 'SELLER') {
                    q = q.eq('user_id', currentUserId);
                } else {
                    if (orgId) q = q.eq('organization_id', orgId);
                    if (selectedSeller !== 'all') q = q.eq('user_id', selectedSeller);
                }

                const { data: fallbackData, error: fallbackError } = await q;
                if (fallbackError) throw fallbackError;

                setCallsLoadError(false);
                setCalls(
                    (fallbackData as any[] || []).map((c: any) => ({
                        ...c,
                        user: c.user ?? undefined,
                        summary: c.summary,
                    }))
                );
            } catch (finalError) {
                console.error('Final error fetching calls:', finalError);
                setCalls([]);
                setCallsLoadError(true);
            }
        }
    };

    const formatDuration = (startedAt: string, endedAt?: string) => {
        const start = new Date(startedAt).getTime();
        const end = endedAt ? new Date(endedAt).getTime() : Date.now();
        const diff = Math.floor((end - start) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6" suppressHydrationWarning={true}>
            <DashboardHeader title="Chamadas" />

            {callsLoadError && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    <strong>Não foi possível carregar as chamadas.</strong>
                </div>
            )}

            {/* Seller Filter (Manager only) */}
            {userRole !== 'SELLER' && teamMembers.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 px-1">
                    <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                    <select
                        value={selectedSeller}
                        onChange={e => setSelectedSeller(e.target.value)}
                        className="bg-[#1e1e1e] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neon-pink/50 appearance-none cursor-pointer w-full sm:w-auto sm:min-w-[200px]"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                        <option value="all">Todos os vendedores</option>
                        {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name || 'Sem nome'}</option>
                        ))}
                    </select>
                    <span className="text-xs text-gray-500">{calls.length} chamada{calls.length !== 1 ? 's' : ''}</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 min-h-0 lg:min-h-[calc(100vh-12rem)]">
                {/* Calls List Sidebar */}
                <div
                    className="w-full lg:w-80 shrink-0 rounded-2xl sm:rounded-[24px] border flex flex-col overflow-hidden max-h-[50vh] lg:max-h-none lg:h-[490px]"
                    style={{ ...CARD_STYLE, borderColor: 'rgba(255,255,255,0.05)' }}
                >
                    <div className="p-3 sm:p-4 border-b border-white/10 shrink-0">
                        <h2 className="text-base sm:text-lg font-bold text-white">Chamadas ({calls.length})</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-dark min-h-0">
                        {calls.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 text-sm" suppressHydrationWarning={true}>
                                {callsLoadError ? 'Erro ao carregar.' : 'Nenhuma chamada encontrada'}
                            </div>
                        ) : (
                            calls.map((call) => (
                                <div
                                    key={call.id}
                                    className={`rounded-xl border p-4 cursor-pointer transition-colors ${selectedCall?.id === call.id
                                        ? 'ring-2 ring-neon-pink bg-neon-pink/10 border-neon-pink/50'
                                        : 'border-white/10 hover:bg-white/5 bg-black/20'
                                        }`}
                                    onClick={() => setSelectedCall(call)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {call.user?.avatar_url ? (
                                                    <img
                                                        src={call.user.avatar_url}
                                                        alt={call.user.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400">
                                                        {call.user?.full_name?.charAt(0).toUpperCase() || 'V'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate">
                                                    {call.user?.full_name ?? 'Vendedor'}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {call.script?.name || 'Script Geral'}
                                                </div>
                                            </div>
                                        </div>
                                        {call.status === 'ACTIVE' ? (
                                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink animate-pulse flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                AO VIVO
                                            </span>
                                        ) : (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${call.summary?.result === 'CONVERTED' ? 'text-neon-green bg-neon-green/20' : 'text-gray-500 bg-white/10'}`}>
                                                {formatDuration(call.started_at, call.ended_at)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center text-xs text-gray-500" suppressHydrationWarning={true}>
                                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                                        <span suppressHydrationWarning={true}>
                                            {new Date(call.started_at).toLocaleTimeString()} - {new Date(call.started_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detalhes da chamada selecionada (histórico; ao vivo fica em /live) */}
                <div className="flex-1 flex flex-col min-h-[280px] sm:min-h-[400px] rounded-2xl sm:rounded-[24px] border overflow-hidden" style={CARD_STYLE}>
                    {!selectedCall ? (
                        <div className="flex items-center justify-center flex-1 text-gray-500 p-8">
                            <div className="text-center">
                                <Phone className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <p className="text-sm">Selecione uma chamada para ver detalhes</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full p-3 sm:p-4 gap-3 sm:gap-4 min-h-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400 shrink-0">
                                <span>{selectedCall.user?.full_name ?? 'Vendedor'}</span>
                                <span>·</span>
                                <span>{selectedCall.script?.name ?? 'Script'}</span>
                                <span>·</span>
                                <span>{formatDuration(selectedCall.started_at, selectedCall.ended_at)}</span>
                                {selectedCall.summary?.lead_sentiment && (
                                    <>
                                        <span>·</span>
                                        <span>{selectedCall.summary.lead_sentiment}</span>
                                    </>
                                )}
                                {selectedCall.summary?.result && (
                                    <>
                                        <span>·</span>
                                        <span>{selectedCall.summary.result}</span>
                                    </>
                                )}
                            </div>
                            <Link
                                href={`/calls/${selectedCall.id}`}
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto py-3 px-5 rounded-xl text-sm font-bold border-2 transition-all hover:opacity-95 hover:shadow-lg shrink-0"
                                style={{
                                    color: NEON_PINK,
                                    borderColor: NEON_PINK,
                                    backgroundColor: 'rgba(255, 0, 122, 0.12)',
                                    boxShadow: '0 0 20px rgba(255, 0, 122, 0.15)',
                                }}
                            >
                                <Zap className="w-4 h-4" />
                                Ver Raio X da Venda
                                <ExternalLink className="w-4 h-4" />
                            </Link>

                            <Card className="flex flex-col rounded-xl sm:rounded-2xl border shadow-none flex-1 min-h-0" style={CARD_STYLE}>
                                <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                                    <CardTitle className="text-sm sm:text-base font-bold text-white">Transcrição</CardTitle>
                                    <CardDescription className="text-gray-500 text-xs sm:text-sm">
                                        Registro da conversa da chamada
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-0 flex flex-col p-0">
                                    <div
                                        ref={transcriptScrollRef}
                                        className="flex-1 overflow-y-auto min-h-[160px] sm:min-h-[240px] max-h-[40vh] sm:max-h-[480px] lg:max-h-[560px] px-4 sm:px-6 pb-4 sm:pb-6 pt-2 scroll-smooth scrollbar-dark"
                                    >
                                        {(!selectedCall.transcript || (Array.isArray(selectedCall.transcript) && selectedCall.transcript.length === 0)) ? (
                                            <p className="text-gray-500 text-sm">Nenhuma transcrição registrada.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {(Array.isArray(selectedCall.transcript) ? selectedCall.transcript : []).map((item: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 rounded-xl text-sm ${(item.role === 'seller' || item.speaker === 'Vendedor') ? 'bg-neon-pink/10 border border-neon-pink/20' : 'bg-white/5 border border-white/10'}`}
                                                    >
                                                        <div className="text-xs font-semibold text-gray-400 mb-0.5">
                                                            {item.speaker ?? (item.role === 'seller' ? 'Vendedor' : 'Lead')}
                                                        </div>
                                                        <div className="text-white">{item.text ?? ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
