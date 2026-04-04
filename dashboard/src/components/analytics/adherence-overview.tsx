'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ScriptAdherenceData } from '@/types/analytics'

const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }
const NEON_GREEN = '#00ff94'
const NEON_ORANGE = '#ff8a00'
const NEON_PINK = '#ff007a'

function adherenceColor(v: number) {
  if (v >= 70) return NEON_GREEN
  if (v >= 40) return NEON_ORANGE
  return NEON_PINK
}

export function AdherenceOverview({ data }: { data: ScriptAdherenceData }) {
  return (
    <Card className="rounded-2xl border shadow-none h-full" style={CARD_STYLE}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white">Aderência ao Script</CardTitle>
        <p className="text-xs text-gray-500">
          Média da equipe:{' '}
          <span className="font-bold" style={{ color: adherenceColor(data.teamAverage) }}>
            {data.teamAverage > 0 ? `${data.teamAverage}%` : '—'}
          </span>
        </p>
      </CardHeader>
      <CardContent>
        {data.sellers.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">Sem dados de aderência no período</p>
        ) : (
          <div className="space-y-3">
            {data.sellers.map((s, i) => {
              const color = adherenceColor(s.avgAdherence)
              return (
                <div key={s.fullName} className="animate-chart-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 truncate max-w-[160px]">{s.fullName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-600">{s.callCount} calls</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{s.avgAdherence}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${s.avgAdherence}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
