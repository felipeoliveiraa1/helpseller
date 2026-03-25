'use client'

import { useEffect, useState } from 'react'
import { NEON_PINK, CARD_BG, CARD_BORDER, LoadingSpinner, SectionCard, KpiCard } from './shared'

interface FeedbackItem {
    id: string
    type: 'bug' | 'suggestion' | 'praise'
    title: string
    description: string
    page_url: string | null
    status: string
    priority: string
    admin_notes: string | null
    created_at: string
    resolved_at: string | null
    user?: { full_name: string | null; email: string | null }
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    bug: { icon: 'bug_report', color: '#ef4444', label: 'Bug' },
    suggestion: { icon: 'lightbulb', color: '#f59e0b', label: 'Sugestão' },
    praise: { icon: 'favorite', color: '#22c55e', label: 'Elogio' },
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    open: { color: '#3b82f6', label: 'Aberto' },
    in_progress: { color: '#f59e0b', label: 'Em Andamento' },
    resolved: { color: '#22c55e', label: 'Resolvido' },
    closed: { color: '#6b7280', label: 'Fechado' },
    wont_fix: { color: '#6b7280', label: 'Não Corrigir' },
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    low: { color: '#6b7280', label: 'Baixa' },
    medium: { color: '#f59e0b', label: 'Média' },
    high: { color: '#f97316', label: 'Alta' },
    critical: { color: '#ef4444', label: 'Crítica' },
}

export default function TabFeedback() {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<FeedbackItem[]>([])
    const [filter, setFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/feedback')
            if (res.ok) {
                const json = await res.json()
                setItems((json.data || []).map((f: any) => ({
                    ...f,
                    user: Array.isArray(f.user) ? f.user[0] : f.user,
                })))
            }
        } catch (err) {
            console.error('Error fetching feedback:', err)
        }
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const updateFeedback = async (id: string, updates: Record<string, string>) => {
        setActionLoading(id)
        try {
            const res = await fetch('/api/feedback', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            })
            if (res.ok) await fetchData()
        } catch {}
        setActionLoading(null)
    }

    if (loading) return <LoadingSpinner />

    const filtered = items.filter(f => {
        if (filter !== 'all' && f.status !== filter) return false
        if (typeFilter !== 'all' && f.type !== typeFilter) return false
        return true
    })

    const bugs = items.filter(f => f.type === 'bug').length
    const suggestions = items.filter(f => f.type === 'suggestion').length
    const praises = items.filter(f => f.type === 'praise').length
    const openCount = items.filter(f => f.status === 'open').length

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Total" value={String(items.length)} sub={`${openCount} abertos`} color={NEON_PINK} icon="chat" />
                <KpiCard label="Bugs" value={String(bugs)} sub="reportados" color="#ef4444" icon="bug_report" />
                <KpiCard label="Sugestoes" value={String(suggestions)} sub="recebidas" color="#f59e0b" icon="lightbulb" />
                <KpiCard label="Elogios" value={String(praises)} sub="recebidos" color="#22c55e" icon="favorite" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                >
                    <option value="all">Todos os status</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                >
                    <option value="all">Todos os tipos</option>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <span className="text-xs text-gray-500 self-center">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            <SectionCard title="Feedback">
                <div className="space-y-2">
                    {filtered.map(f => {
                        const tc = TYPE_CONFIG[f.type] || TYPE_CONFIG.bug
                        const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.open
                        const pc = PRIORITY_CONFIG[f.priority] || PRIORITY_CONFIG.medium
                        const isExpanded = expandedId === f.id

                        return (
                            <div
                                key={f.id}
                                className="rounded-xl border border-white/5 overflow-hidden transition-colors hover:border-white/10"
                                style={{ backgroundColor: '#111' }}
                            >
                                {/* Header row */}
                                <div
                                    className="flex items-center gap-3 p-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                                >
                                    <span className="material-icons-outlined text-lg" style={{ color: tc.color }}>{tc.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-sm font-medium truncate">{f.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-600">{f.user?.full_name || f.user?.email || 'Anônimo'}</span>
                                            <span className="text-[10px] text-gray-700">·</span>
                                            <span className="text-[10px] text-gray-600">{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold`} style={{ backgroundColor: `${sc.color}20`, color: sc.color }}>{sc.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold`} style={{ backgroundColor: `${pc.color}20`, color: pc.color }}>{pc.label}</span>
                                    <span className="material-icons-outlined text-gray-600 text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{f.description}</p>
                                        {f.page_url && (
                                            <p className="text-[10px] text-gray-600">Página: {f.page_url}</p>
                                        )}

                                        {/* Admin actions */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <select
                                                value={f.status}
                                                onChange={e => updateFeedback(f.id, { status: e.target.value })}
                                                disabled={actionLoading === f.id}
                                                className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5"
                                            >
                                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={f.priority}
                                                onChange={e => updateFeedback(f.id, { priority: e.target.value })}
                                                disabled={actionLoading === f.id}
                                                className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5"
                                            >
                                                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {filtered.length === 0 && (
                        <div className="py-8 text-center text-gray-600 text-sm">Nenhum feedback encontrado</div>
                    )}
                </div>
            </SectionCard>
        </div>
    )
}
