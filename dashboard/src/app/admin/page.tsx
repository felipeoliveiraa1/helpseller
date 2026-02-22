'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────
interface UsageLog {
    id: string
    call_id: string
    user_id: string | null
    service: string
    method: string
    model: string | null
    prompt_tokens: number
    completion_tokens: number
    cached_tokens: number
    total_tokens: number
    duration_seconds: number | null
    participants: number
    cost_usd: number
    created_at: string
}

interface CallInfo {
    id: string
    started_at: string
    duration_seconds: number | null
    user?: { full_name?: string }
}

// ─── Constants ──────────────────────────────────────────────
const NEON_PINK = '#ff007a'
const COLORS = {
    openai: '#a855f7',    // purple
    deepgram: '#3b82f6',  // blue
    livekit: '#22c55e',   // green
}
const BRL_RATE = 5.80

// ─── Admin Credentials ──────────────────────────────────────
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin'

// ─── Page Component ─────────────────────────────────────────
export default function AdminPage() {
    const supabase = createClient()
    const [logs, setLogs] = useState<UsageLog[]>([])
    const [calls, setCalls] = useState<CallInfo[]>([])
    const [profileById, setProfileById] = useState<Record<string, { full_name: string | null }>>({})
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')

    // Auth gate
    const [mounted, setMounted] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loginUser, setLoginUser] = useState('')
    const [loginPass, setLoginPass] = useState('')
    const [loginError, setLoginError] = useState(false)
    const [shaking, setShaking] = useState(false)

    // Check sessionStorage on mount
    useEffect(() => {
        setMounted(true)
        if (sessionStorage.getItem('admin_auth') === 'true') {
            setIsAuthenticated(true)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
            setIsAuthenticated(true)
            setLoginError(false)
            sessionStorage.setItem('admin_auth', 'true')
        } else {
            setLoginError(true)
            setShaking(true)
            setTimeout(() => setShaking(false), 500)
        }
    }

    // Fetch data — ALL hooks MUST be before any early return
    useEffect(() => {
        if (!isAuthenticated) return
        async function fetchData() {
            setLoading(true)

            let dateFilter: string | null = null
            if (period === '7d') {
                dateFilter = new Date(Date.now() - 7 * 86400000).toISOString()
            } else if (period === '30d') {
                dateFilter = new Date(Date.now() - 30 * 86400000).toISOString()
            }

            let logsQuery = supabase
                .from('ai_usage_logs')
                .select('*')
                .order('created_at', { ascending: false })
            if (dateFilter) {
                logsQuery = logsQuery.gte('created_at', dateFilter)
            }
            const { data: logsData } = await logsQuery
            const logsList = (logsData as UsageLog[]) ?? []
            setLogs(logsList)

            let callsQuery = supabase
                .from('calls')
                .select('id, started_at, duration_seconds, user:profiles!user_id(full_name)')
                .order('started_at', { ascending: false })
            if (dateFilter) {
                callsQuery = callsQuery.gte('started_at', dateFilter)
            }
            const { data: callsData } = await callsQuery
            const callsFromPeriod = (callsData as any[])?.map((c: any) => ({
                ...c,
                user: Array.isArray(c.user) ? c.user[0] : c.user
            })) ?? []
            const callIdsWeHave = new Set(callsFromPeriod.map((c: { id: string }) => c.id))
            const callIdsInLogs = [...new Set(logsList.map(l => l.call_id).filter(Boolean))] as string[]
            const missingCallIds = callIdsInLogs.filter(id => !callIdsWeHave.has(id))
            let mergedCalls = callsFromPeriod
            if (missingCallIds.length > 0) {
                const { data: extraCalls } = await supabase
                    .from('calls')
                    .select('id, started_at, duration_seconds, user:profiles!user_id(full_name)')
                    .in('id', missingCallIds)
                const normalized = (extraCalls as any[])?.map((c: any) => ({
                    ...c,
                    user: Array.isArray(c.user) ? c.user[0] : c.user
                })) ?? []
                mergedCalls = [...callsFromPeriod, ...normalized]
            }
            setCalls(mergedCalls)
            const userIdsFromLogs = [...new Set(logsList.map(l => l.user_id).filter(Boolean))] as string[]
            if (userIdsFromLogs.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIdsFromLogs)
                const map: Record<string, { full_name: string | null }> = {}
                ;(profilesData ?? []).forEach((p: { id: string; full_name: string | null }) => {
                    map[p.id] = { full_name: p.full_name }
                })
                setProfileById(map)
            } else {
                setProfileById({})
            }

            setLoading(false)
        }
        fetchData()
    }, [period, isAuthenticated])

    // ─── Computed Data (hooks must be before returns) ─────────────
    const totalCostUsd = useMemo(() => logs.reduce((sum, l) => sum + Number(l.cost_usd), 0), [logs])

    const costByService = useMemo(() => {
        const map: Record<string, number> = {}
        for (const l of logs) {
            map[l.service] = (map[l.service] || 0) + Number(l.cost_usd)
        }
        return Object.entries(map).map(([service, cost]) => ({ service, cost: +cost.toFixed(6) }))
    }, [logs])

    const costByCall = useMemo(() => {
        const map: Record<string, { openai: number; deepgram: number; livekit: number; total: number }> = {}
        for (const l of logs) {
            if (!map[l.call_id]) map[l.call_id] = { openai: 0, deepgram: 0, livekit: 0, total: 0 }
            const entry = map[l.call_id]
            const cost = Number(l.cost_usd)
            if (l.service === 'openai') entry.openai += cost
            else if (l.service === 'deepgram') entry.deepgram += cost
            else if (l.service === 'livekit') entry.livekit += cost
            entry.total += cost
        }
        return map
    }, [logs])

    const dailyCosts = useMemo(() => {
        const map: Record<string, number> = {}
        for (const l of logs) {
            const day = l.created_at.slice(0, 10)
            map[day] = (map[day] || 0) + Number(l.cost_usd)
        }
        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, cost]) => ({
                date: date.slice(5),
                cost: +cost.toFixed(4)
            }))
    }, [logs])

    const callById = useMemo(() => {
        const map: Record<string, CallInfo> = {}
        for (const c of calls) {
            map[c.id] = c
        }
        return map
    }, [calls])

    const callIdToFirstDate = useMemo(() => {
        const map: Record<string, string> = {}
        for (const l of logs) {
            if (!l.call_id) continue
            if (!map[l.call_id] || l.created_at < map[l.call_id]) {
                map[l.call_id] = l.created_at
            }
        }
        return map
    }, [logs])

    const callIdToUserId = useMemo(() => {
        const map: Record<string, string> = {}
        for (const l of logs) {
            if (l.call_id && l.user_id && !map[l.call_id]) {
                map[l.call_id] = l.user_id
            }
        }
        return map
    }, [logs])

    const summaryRowsByCall = useMemo(() => {
        return Object.entries(costByCall)
            .filter(([callId]) => callId && callId !== 'null' && callId !== 'undefined')
            .map(([callId, costs]) => {
                const call = callById[callId]
                const date = call?.started_at ?? callIdToFirstDate[callId] ?? ''
                return { callId, costs, call, date }
            })
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    }, [costByCall, callById, callIdToFirstDate])

    const totalCalls = summaryRowsByCall.length
    const avgCostPerCall = totalCalls > 0 ? totalCostUsd / totalCalls : 0
    const avgDuration = useMemo(() => {
        const durations = calls.filter(c => c.duration_seconds && c.duration_seconds > 0).map(c => c.duration_seconds!)
        return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    }, [calls])

    const totalTokensIn = useMemo(() => logs.filter(l => l.service === 'openai').reduce((s, l) => s + l.prompt_tokens, 0), [logs])
    const totalTokensOut = useMemo(() => logs.filter(l => l.service === 'openai').reduce((s, l) => s + l.completion_tokens, 0), [logs])
    const totalTokensCached = useMemo(() => logs.filter(l => l.service === 'openai').reduce((s, l) => s + l.cached_tokens, 0), [logs])

    const pieData = costByService.map(s => ({
        name: s.service.charAt(0).toUpperCase() + s.service.slice(1),
        value: s.cost
    }))

    // ─── Formatters ─────────────────────────────────────────────
    const fmtUsd = (n: number) => `$${n.toFixed(4)}`
    const fmtBrl = (n: number) => `R$ ${(n * BRL_RATE).toFixed(2)}`
    const fmtDuration = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = Math.round(s % 60)
        return `${m}m ${sec}s`
    }
    const fmtTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
    const fmtDate = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    // ─── SSR-safe: show nothing until mounted ────────────────────
    if (!mounted) {
        return null
    }

    // ─── Login Screen ────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div suppressHydrationWarning className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
                <form
                    onSubmit={handleLogin}
                    className={`w-full max-w-sm rounded-2xl p-8 border space-y-6 ${shaking ? 'animate-shake' : ''}`}
                    style={{ backgroundColor: '#1a1a1a', borderColor: loginError ? '#ff4444' : 'rgba(255,255,255,0.08)' }}
                >
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${NEON_PINK}15` }}>
                            <span className="material-icons-outlined text-[28px]" style={{ color: NEON_PINK }}>admin_panel_settings</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">Admin Access</h1>
                        <p className="text-xs text-gray-500">Área restrita — apenas administradores</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Usuário</label>
                            <input
                                type="text"
                                value={loginUser}
                                onChange={e => { setLoginUser(e.target.value); setLoginError(false) }}
                                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
                                style={{ backgroundColor: '#111', border: `1px solid ${loginError ? '#ff4444' : 'rgba(255,255,255,0.08)'}` }}
                                placeholder="Usuário"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Senha</label>
                            <input
                                type="password"
                                value={loginPass}
                                onChange={e => { setLoginPass(e.target.value); setLoginError(false) }}
                                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
                                style={{ backgroundColor: '#111', border: `1px solid ${loginError ? '#ff4444' : 'rgba(255,255,255,0.08)'}` }}
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    {loginError && (
                        <p className="text-xs text-red-400 text-center">Credenciais inválidas</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ backgroundColor: NEON_PINK }}
                    >
                        Entrar
                    </button>
                </form>

                <style jsx>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20% { transform: translateX(-8px); }
                        40% { transform: translateX(8px); }
                        60% { transform: translateX(-5px); }
                        80% { transform: translateX(5px); }
                    }
                    .animate-shake { animation: shake 0.4s ease-in-out; }
                `}</style>
            </div>
        )
    }

    // ─── Dashboard Render ─────────────────────────────────────────
    return (
        <div className="flex-1 p-8 space-y-8 min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Administração — Custos</h1>
                    <p className="text-sm text-gray-500 mt-1">Rastreamento de custos por chamada com precisão de tokens</p>
                </div>
                <div className="flex gap-2">
                    {(['7d', '30d', 'all'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
                                }`}
                            style={period === p ? { backgroundColor: NEON_PINK } : undefined}
                        >
                            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Tudo'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: `${NEON_PINK} transparent transparent transparent` }} />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Custo Total"
                            value={fmtUsd(totalCostUsd)}
                            sub={fmtBrl(totalCostUsd)}
                            color={NEON_PINK}
                            icon="payments"
                        />
                        <KpiCard
                            label="Total de Chamadas"
                            value={`${totalCalls}`}
                            sub="com dados de custo"
                            color="#f59e0b"
                            icon="call"
                        />
                        <KpiCard
                            label="Custo Médio / Call"
                            value={fmtUsd(avgCostPerCall)}
                            sub={fmtBrl(avgCostPerCall)}
                            color="#22c55e"
                            icon="trending_down"
                        />
                        <KpiCard
                            label="Duração Média"
                            value={fmtDuration(avgDuration)}
                            sub={`${calls.length} chamadas totais`}
                            color="#3b82f6"
                            icon="timer"
                        />
                    </div>

                    {/* Token Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TokenCard label="Tokens de Entrada" value={fmtTokens(totalTokensIn)} icon="input" color="#a855f7" />
                        <TokenCard label="Tokens de Saída" value={fmtTokens(totalTokensOut)} icon="output" color="#ec4899" />
                        <TokenCard label="Tokens em Cache" value={fmtTokens(totalTokensCached)} icon="cached" color="#06b6d4" />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Chart — Cost by Service */}
                        <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h3 className="text-sm font-semibold text-gray-300 mb-4">💰 Custo por Serviço</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={costByService} barSize={48}>
                                    <XAxis dataKey="service" stroke="#666" fontSize={12} tickFormatter={s => s.charAt(0).toUpperCase() + s.slice(1)} />
                                    <YAxis stroke="#666" fontSize={11} tickFormatter={v => `$${v}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }}
                                        labelStyle={{ color: '#999' }}
                                        formatter={(value: any) => [`$${Number(value).toFixed(6)}`, 'Custo']}
                                    />
                                    <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                                        {costByService.map((entry, i) => (
                                            <Cell key={i} fill={(COLORS as any)[entry.service] || '#888'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie Chart — Share % */}
                        <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h3 className="text-sm font-semibold text-gray-300 mb-4">📊 Distribuição de Custos</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={(COLORS as any)[entry.name.toLowerCase()] || '#888'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }}
                                        formatter={(value: any) => [`$${Number(value).toFixed(6)}`, 'Custo']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Line Chart — Daily Cost */}
                    <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">📈 Custo Diário</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={dailyCosts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="#666" fontSize={11} />
                                <YAxis stroke="#666" fontSize={11} tickFormatter={v => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }}
                                    formatter={(value: any) => [`$${Number(value).toFixed(4)}`, 'Custo']}
                                />
                                <Line type="monotone" dataKey="cost" stroke={NEON_PINK} strokeWidth={2.5} dot={{ r: 3, fill: NEON_PINK }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detail: summary by call + individual usage records */}
                    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h3 className="text-sm font-semibold text-gray-300">📋 Detalhamento por Chamada</h3>
                            <p className="text-xs text-gray-500 mt-1">Resumo por chamada de voz e custo individual de cada uso (registro)</p>
                        </div>
                        <div className="overflow-x-auto scrollbar-dark">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 text-left text-xs uppercase" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                        <th className="px-6 py-3 font-medium">Data</th>
                                        <th className="px-6 py-3 font-medium">Vendedor</th>
                                        <th className="px-6 py-3 font-medium">Duração</th>
                                        <th className="px-6 py-3 font-medium text-right" style={{ color: COLORS.openai }}>OpenAI</th>
                                        <th className="px-6 py-3 font-medium text-right" style={{ color: COLORS.deepgram }}>Deepgram</th>
                                        <th className="px-6 py-3 font-medium text-right" style={{ color: COLORS.livekit }}>LiveKit</th>
                                        <th className="px-6 py-3 font-medium text-right" style={{ color: NEON_PINK }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryRowsByCall.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                Nenhuma chamada com dados de custo encontrada neste período
                                            </td>
                                        </tr>
                                    ) : (
                                        summaryRowsByCall.map((row) => {
                                            const sellerName = row.call?.user?.full_name ?? profileById[callIdToUserId[row.callId]]?.full_name ?? '—'
                                            return (
                                            <tr key={row.callId} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                                <td className="px-6 py-3 text-gray-300">{row.date ? fmtDate(row.date) : '—'}</td>
                                                <td className="px-6 py-3 text-white font-medium">{sellerName}</td>
                                                <td className="px-6 py-3 text-gray-400">{row.call?.duration_seconds != null ? fmtDuration(row.call.duration_seconds) : '—'}</td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-300">{fmtUsd(row.costs.openai)}</td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-300">{fmtUsd(row.costs.deepgram)}</td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-300">{fmtUsd(row.costs.livekit)}</td>
                                                <td className="px-6 py-3 text-right font-mono font-semibold" style={{ color: NEON_PINK }}>{fmtUsd(row.costs.total)}</td>
                                            </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Individual usage records — cost per API call / usage */}
                        <div className="border-t px-6 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <h4 className="text-xs font-semibold text-gray-400 mb-3">Custo individual por registro de uso</h4>
                            <div className="overflow-x-auto scrollbar-dark">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-500 text-left text-xs uppercase" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                            <th className="px-4 py-2 font-medium">Data/Hora</th>
                                            <th className="px-4 py-2 font-medium">Chamada (vendedor)</th>
                                            <th className="px-4 py-2 font-medium">Serviço</th>
                                            <th className="px-4 py-2 font-medium">Método</th>
                                            <th className="px-4 py-2 font-medium">Modelo / Detalhe</th>
                                            <th className="px-4 py-2 font-medium text-right">Custo (USD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                    Nenhum registro de uso neste período
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => {
                                                const call = log.call_id ? callById[log.call_id] : null
                                                const detail = log.service === 'openai'
                                                    ? `${fmtTokens(log.prompt_tokens)} in / ${fmtTokens(log.completion_tokens)} out`
                                                    : log.duration_seconds != null
                                                        ? fmtDuration(log.duration_seconds)
                                                        : '—'
                                                const modelOrDetail = log.model ? `${log.model} • ${detail}` : detail
                                                return (
                                                    <tr key={log.id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                                        <td className="px-4 py-2 text-gray-300 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                                                        <td className="px-4 py-2 text-white font-medium">{call?.user?.full_name ?? profileById[log.user_id ?? '']?.full_name ?? (log.call_id ? log.call_id.slice(0, 8) + '…' : '—')}</td>
                                                        <td className="px-4 py-2" style={{ color: (COLORS as Record<string, string>)[log.service] ?? '#888' }}>{log.service}</td>
                                                        <td className="px-4 py-2 text-gray-400">{log.method || '—'}</td>
                                                        <td className="px-4 py-2 text-gray-400">{modelOrDetail}</td>
                                                        <td className="px-4 py-2 text-right font-mono font-semibold" style={{ color: NEON_PINK }}>{fmtUsd(Number(log.cost_usd))}</td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Sub Components ─────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: string }) {
    return (
        <div
            className="rounded-2xl p-6 border transition-all hover:scale-[1.02]"
            style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <span className="material-icons-outlined text-[20px]" style={{ color }}>{icon}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
    )
}

function TokenCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
    return (
        <div
            className="rounded-2xl px-5 py-4 border flex items-center gap-4"
            style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
        >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <span className="material-icons-outlined text-[18px]" style={{ color }}>{icon}</span>
            </div>
            <div>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[11px] text-gray-500">{label}</p>
            </div>
        </div>
    )
}
