'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PipelineFunnel } from '@/types/analytics'

const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }

const STAGES = [
  { key: 'converted' as const, label: 'Convertido', color: '#00ff94', bg: 'rgba(0,255,148,0.12)' },
  { key: 'followUp' as const, label: 'Follow-up', color: '#ff8a00', bg: 'rgba(255,138,0,0.12)' },
  { key: 'lost' as const, label: 'Perdido', color: '#ff007a', bg: 'rgba(255,0,122,0.12)' },
  { key: 'unknown' as const, label: 'Sem análise', color: '#555', bg: 'rgba(255,255,255,0.04)' },
]

export function PipelineFunnelCard({ data }: { data: PipelineFunnel }) {
  const total = data.converted + data.followUp + data.lost + data.unknown
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white">Pipeline de Resultados</CardTitle>
        <p className="text-xs text-gray-500">{total} chamadas com summary de IA</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar */}
        <div className="flex h-3 w-full rounded-full overflow-hidden gap-px">
          {STAGES.map(s => {
            const p = pct(data[s.key])
            if (p === 0) return null
            return (
              <div
                key={s.key}
                style={{ width: `${p}%`, backgroundColor: s.color, transition: 'width 0.6s ease' }}
                title={`${s.label}: ${p}%`}
              />
            )
          })}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              className="flex items-center gap-3 p-3 rounded-xl border animate-chart-in opacity-0"
              style={{ backgroundColor: s.bg, borderColor: `${s.color}20`, animationDelay: `${i * 80}ms` }}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-medium truncate">{s.label}</p>
                <p className="text-lg font-bold text-white leading-none mt-0.5">
                  {data[s.key]}
                  <span className="text-xs text-gray-500 ml-1 font-normal">{pct(data[s.key])}%</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
