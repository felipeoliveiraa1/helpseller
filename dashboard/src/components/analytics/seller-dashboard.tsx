'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Phone, TrendingUp, Target, Clock, AlertCircle, ChevronRight, Flame } from 'lucide-react'
import { usePlanLimits } from '@/components/feature-gate'
import { linePathFromData, areaPathFromData } from '@/lib/chart-utils'

const NEON_PINK = '#ff007a'
const NEON_BLUE = '#00d1ff'
const NEON_GREEN = '#00ff94'
const NEON_ORANGE = '#ff8a00'

const CHART_WIDTH = 960
const CHART_HEIGHT = 200
const CHART_PADDING = 20
const CHART_MARGIN_LEFT = -10
const PLOT_WIDTH = CHART_WIDTH - CHART_MARGIN_LEFT
const CHART_DAYS = 14

interface NextStep {
  task: string
  priority: 'high' | 'medium' | 'low'
}

const METRIC_PATHS = [
  'M0 25 Q 10 5, 20 20 T 40 10 T 60 15',
  'M0 15 Q 15 25, 30 10 T 60 20',
  'M0 10 Q 15 5, 30 20 T 60 15',
  'M0 20 Q 15 10, 30 25 T 60 15',
]

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function SellerDashboard() {
  const [loading, setLoading] = useState(true)
  const [callsToday, setCallsToday] = useState(0)
  const [callsMonth, setCallsMonth] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [followUpCount, setFollowUpCount] = useState(0)
  const [nextSteps, setNextSteps] = useState<NextStep[]>([])
  const [chartData, setChartData] = useState<{ label: string; count: number }[]>([])
  const [progressReady, setProgressReady] = useState(false)
  const [userName, setUserName] = useState('')
  const supabase = createClient()

  const { plan, limits, usage, loading: planLoading } = usePlanLimits()
  const hasCallLimit = limits.maxCallHoursPerMonth > 0
  const usedHours = usage.currentCallHoursThisMonth
  const maxHours = limits.maxCallHoursPerMonth
  const remainingHours = maxHours === -1 ? Infinity : Math.max(0, maxHours - usedHours)
  const usagePercent = maxHours > 0 ? Math.min(100, (usedHours / maxHours) * 100) : 0
  const isNearLimit = usagePercent >= 80
  const isAtLimit = usagePercent >= 100

  useEffect(() => {
    const t = setTimeout(() => setProgressReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Get user name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile) setUserName((profile as { full_name?: string }).full_name ?? '')

      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Chart: last 14 days
      const chartStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      chartStart.setDate(chartStart.getDate() - (CHART_DAYS - 1))
      const chartStartIso = chartStart.toISOString()

      const [todayRes, monthRes, chartRes, callIdsRes] = await Promise.all([
        supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'COMPLETED')
          .gte('started_at', startOfDay),
        supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'COMPLETED')
          .gte('ended_at', firstOfMonth),
        supabase
          .from('calls')
          .select('started_at, ended_at')
          .eq('user_id', user.id)
          .eq('status', 'COMPLETED')
          .gte('ended_at', chartStartIso),
        supabase
          .from('calls')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'COMPLETED')
          .gte('ended_at', firstOfMonth),
      ])

      setCallsToday(todayRes.count ?? 0)
      setCallsMonth(monthRes.count ?? 0)

      // Conversion + follow-up
      const callIds = (callIdsRes.data as { id: string }[] | null)?.map(c => c.id) ?? []
      if (callIds.length > 0) {
        const [convRes, followRes] = await Promise.all([
          supabase
            .from('call_summaries')
            .select('call_id', { count: 'exact', head: true })
            .eq('result', 'CONVERTED')
            .in('call_id', callIds),
          supabase
            .from('call_summaries')
            .select('call_id', { count: 'exact', head: true })
            .eq('result', 'FOLLOW_UP')
            .in('call_id', callIds),
        ])
        const converted = convRes.count ?? 0
        const followUp = followRes.count ?? 0
        setConversionRate(callIds.length > 0 ? Math.round((converted / callIds.length) * 100) : 0)
        setFollowUpCount(followUp)
      }

      // Chart data
      const chartRows = (chartRes.data as { started_at: string; ended_at: string | null }[] | null) ?? []
      const toDayKey = (d: Date) =>
        `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
      const byDay: Record<string, number> = {}
      for (let i = 0; i < CHART_DAYS; i++) {
        const d = new Date(chartStart)
        d.setDate(d.getDate() + i)
        byDay[toDayKey(d)] = 0
      }
      chartRows.forEach(c => {
        const endAt = c.ended_at ?? c.started_at
        const d = new Date(endAt)
        const key = toDayKey(d)
        if (key in byDay) byDay[key] += 1
      })
      const labels: { label: string; count: number }[] = []
      for (let i = 0; i < CHART_DAYS; i++) {
        const d = new Date(chartStart)
        d.setDate(d.getDate() + i)
        const key = toDayKey(d)
        labels.push({
          label: `${DAY_LABELS[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}`,
          count: byDay[key] ?? 0,
        })
      }
      setChartData(labels)

      // Next steps
      const { data: stepsData } = await supabase
        .from('call_summaries')
        .select(`
          next_steps,
          created_at,
          call:calls!inner(user_id)
        `)
        .eq('calls.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (stepsData) {
        const steps: NextStep[] = []
        ;(stepsData as { next_steps?: string[] }[]).forEach(summary => {
          if (Array.isArray(summary.next_steps)) {
            summary.next_steps.forEach((step: string) => {
              steps.push({ task: step, priority: 'medium' })
            })
          }
        })
        setNextSteps(steps.slice(0, 5))
      }

      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const metrics = [
    { value: String(callsToday), label: 'Chamadas hoje', color: NEON_PINK, icon: Phone, path: METRIC_PATHS[0] },
    { value: String(callsMonth), label: 'Total no mês', color: NEON_BLUE, icon: Flame, path: METRIC_PATHS[1] },
    { value: `${conversionRate}%`, label: 'Conversão', color: NEON_GREEN, icon: TrendingUp, path: METRIC_PATHS[2] },
    { value: String(followUpCount), label: 'Em negociação', color: NEON_ORANGE, icon: Target, path: METRIC_PATHS[3] },
  ]

  const chartValues = chartData.map(d => d.count)
  const chartLabels = chartData.map(d => d.label)
  const hasChartData = chartValues.some(v => v > 0)

  function getChartScale(values: number[]) {
    const dataMin = Math.min(...values, 0)
    const dataMax = Math.max(...values, 1)
    const range = dataMax - dataMin || 1
    const innerHeight = CHART_HEIGHT - CHART_PADDING * 2
    const valueToY = (v: number) =>
      CHART_PADDING + innerHeight - ((v - dataMin) / range) * innerHeight
    const ticks = 5
    const step = (dataMax - dataMin) / (ticks - 1) || 1
    const yTickValues = Array.from({ length: ticks }, (_, i) => Math.round(dataMin + step * i))
    return { valueToY, yTickValues }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="animate-chart-in opacity-0" style={{ animationDelay: '0ms' }}>
        <h2 className="text-2xl font-bold text-white">
          {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Acompanhe seu desempenho e próximas ações</p>
      </div>

      {/* Call Hours Usage */}
      {!planLoading && hasCallLimit && (
        <div
          className="rounded-[24px] border p-5 animate-chart-in opacity-0"
          style={{
            backgroundColor: '#1e1e1e',
            borderColor: isAtLimit ? 'rgba(239,68,68,0.3)' : isNearLimit ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.05)',
            animationDelay: '0ms',
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: isAtLimit ? 'rgba(239,68,68,0.1)' : isNearLimit ? 'rgba(234,179,8,0.1)' : `${NEON_GREEN}15` }}
              >
                <Clock className="w-5 h-5" style={{ color: isAtLimit ? '#ef4444' : isNearLimit ? '#eab308' : NEON_GREEN }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Uso de Calls</p>
                <p className="text-xs text-gray-500">
                  {usedHours.toFixed(1)}h de {maxHours === -1 ? '∞' : `${maxHours}h`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-lg font-bold"
                style={{ color: isAtLimit ? '#ef4444' : isNearLimit ? '#eab308' : NEON_GREEN }}
              >
                {maxHours === -1 ? '∞' : `${remainingHours.toFixed(1)}h`}
                <span className="text-xs text-gray-500 ml-1 font-normal">restantes</span>
              </span>
              <div className="w-32 h-2.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressReady ? usagePercent : 0}%`,
                    backgroundColor: isAtLimit ? '#ef4444' : isNearLimit ? '#eab308' : NEON_GREEN,
                    boxShadow: `0 0 8px ${isAtLimit ? '#ef4444' : isNearLimit ? '#eab308' : NEON_GREEN}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div
        className="rounded-[24px] border flex flex-col md:flex-row items-stretch"
        style={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        {metrics.map((m, i) => (
          <div key={m.label} className="flex flex-1 flex-col md:flex-row min-w-0">
            {i > 0 && (
              <div className="hidden md:flex shrink-0 w-px self-stretch items-center justify-center py-4" aria-hidden>
                <svg className="w-px" style={{ height: '70%' }} viewBox="0 0 1 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
                </svg>
              </div>
            )}
            {i > 0 && <div className="md:hidden w-full h-px shrink-0 bg-slate-500/50" aria-hidden />}
            <div
              className="flex-1 p-6 flex flex-col justify-center min-w-0 animate-chart-in opacity-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="text-2xl font-bold text-white mb-1">
                {loading ? '—' : m.value}
              </h3>
              <div className="flex items-center justify-between gap-2">
                <p className="text-gray-500 text-sm">{m.label}</p>
                <svg
                  className="w-16 h-8 shrink-0 overflow-visible"
                  viewBox="-2 2 64 26"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ filter: `drop-shadow(0 0 4px ${m.color})` }}
                >
                  <path
                    className="chart-path animate-chart-path"
                    d={m.path}
                    fill="none"
                    stroke={m.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    pathLength={100}
                    style={{ animationDelay: `${200 + i * 80}ms` }}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart - Last 14 Days */}
      <div
        className="p-4 sm:p-6 rounded-[24px] border animate-chart-in opacity-0 overflow-hidden"
        style={{
          backgroundColor: '#1e1e1e',
          borderColor: 'rgba(255,255,255,0.05)',
          animationDelay: '320ms',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base sm:text-lg font-bold text-white">Minhas Chamadas</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: NEON_PINK }} />
            <span className="text-xs text-gray-400">Últimos 14 dias</span>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <div className="w-full aspect-[5/1] min-h-[160px] max-h-[240px] relative">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Carregando...</div>
            ) : !hasChartData ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Nenhuma chamada no período
              </div>
            ) : (
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 30}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="grad-pink-seller" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={NEON_PINK} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={NEON_PINK} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const { valueToY, yTickValues } = getChartScale(chartValues)
                  return (
                    <>
                      {yTickValues.map((v, vi) => {
                        const y = valueToY(v)
                        return (
                          <g key={`ytick-${vi}`}>
                            <line x1={CHART_MARGIN_LEFT} y1={y} x2={CHART_WIDTH} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                            <text x={CHART_MARGIN_LEFT - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-gray-500 text-[10px] font-semibold">{v}</text>
                          </g>
                        )
                      })}
                      <line x1={CHART_MARGIN_LEFT} y1={CHART_HEIGHT - CHART_PADDING} x2={CHART_WIDTH} y2={CHART_HEIGHT - CHART_PADDING} stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
                      {chartLabels.map((label, i) => {
                        const tickX = CHART_MARGIN_LEFT + (PLOT_WIDTH * i) / Math.max(chartLabels.length - 1, 1)
                        return (
                          <text key={label + i} x={tickX} y={CHART_HEIGHT + 14} textAnchor="middle" className="fill-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            {label}
                          </text>
                        )
                      })}
                    </>
                  )
                })()}
                <g transform={`translate(${CHART_MARGIN_LEFT}, 0)`}>
                  <path
                    className="animate-chart-area"
                    d={areaPathFromData(chartValues, PLOT_WIDTH, CHART_HEIGHT, CHART_PADDING)}
                    fill="url(#grad-pink-seller)"
                  />
                  <path
                    className="chart-path animate-chart-path"
                    d={linePathFromData(chartValues, PLOT_WIDTH, CHART_HEIGHT, CHART_PADDING)}
                    fill="none"
                    stroke={NEON_PINK}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    pathLength={100}
                    style={{ filter: `drop-shadow(0 0 4px ${NEON_PINK})`, animationDelay: '0.4s' }}
                  />
                </g>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Next Steps + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Steps */}
        <div
          className="lg:col-span-2 p-6 rounded-[24px] border animate-chart-in opacity-0"
          style={{
            backgroundColor: '#1e1e1e',
            borderColor: 'rgba(255,255,255,0.05)',
            animationDelay: '400ms',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Próximas Ações</h2>
            <Link
              href="/calls"
              className="text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              style={{ color: NEON_PINK }}
            >
              Ver chamadas
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : nextSteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${NEON_GREEN}15`, border: `1px solid ${NEON_GREEN}30` }}
              >
                <Target className="w-7 h-7" style={{ color: NEON_GREEN }} />
              </div>
              <p className="text-gray-400 text-sm">Nenhuma ação pendente</p>
              <p className="text-gray-600 text-xs mt-1">Faça chamadas para gerar tarefas automaticamente</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {nextSteps.map((step, i) => {
                const priorityColor = step.priority === 'high' ? '#ef4444' : step.priority === 'medium' ? NEON_ORANGE : NEON_BLUE
                return (
                  <li
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors animate-chart-in opacity-0"
                    style={{ animationDelay: `${480 + i * 60}ms` }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: priorityColor, boxShadow: `0 0 6px ${priorityColor}` }}
                    />
                    <span className="text-sm text-gray-300 flex-1">{step.task}</span>
                    <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Insights */}
        <div
          className="p-6 rounded-[24px] border animate-chart-in opacity-0"
          style={{
            backgroundColor: '#1e1e1e',
            borderColor: 'rgba(255,255,255,0.05)',
            animationDelay: '480ms',
          }}
        >
          <h2 className="text-lg font-bold text-white mb-6">Insights</h2>
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border"
              style={{ backgroundColor: `${NEON_BLUE}08`, borderColor: `${NEON_BLUE}20` }}
            >
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" style={{ color: NEON_BLUE }} />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Conversão</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {conversionRate >= 50
                      ? 'Excelente! Sua taxa de conversão está acima da média. Continue assim!'
                      : conversionRate >= 25
                        ? 'Boa taxa! Siga os scripts do coach para melhorar ainda mais.'
                        : 'Foque nos scripts sugeridos pelo coach para melhorar sua conversão.'}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="p-4 rounded-xl border"
              style={{ backgroundColor: `${NEON_ORANGE}08`, borderColor: `${NEON_ORANGE}20` }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: NEON_ORANGE }} />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Dica</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {followUpCount > 0
                      ? `Você tem ${followUpCount} negociação${followUpCount > 1 ? 'ões' : ''} em andamento. Faça o follow-up para fechar!`
                      : 'Continue fazendo chamadas e siga os scripts para gerar mais negociações.'}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="p-4 rounded-xl border"
              style={{ backgroundColor: `${NEON_GREEN}08`, borderColor: `${NEON_GREEN}20` }}
            >
              <div className="flex items-start gap-3">
                <Flame className="w-5 h-5 shrink-0 mt-0.5" style={{ color: NEON_GREEN }} />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Meta do dia</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {callsToday >= 5
                      ? `${callsToday} chamadas hoje — ótimo ritmo! Mantenha o foco.`
                      : callsToday > 0
                        ? `${callsToday} chamada${callsToday > 1 ? 's' : ''} hoje. Tente alcançar pelo menos 5!`
                        : 'Nenhuma chamada hoje ainda. Comece agora para bater sua meta!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
