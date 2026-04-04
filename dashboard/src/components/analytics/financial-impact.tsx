'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FinancialImpact } from '@/types/analytics'

const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }
const NEON_GREEN = '#00ff94'

function formatBRL(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

export function FinancialImpactCard({ data }: { data: FinancialImpact }) {
  if (data.callsWithFinancialData === 0) return null

  return (
    <Card className="rounded-2xl border shadow-none" style={{ ...CARD_STYLE, borderColor: 'rgba(0,255,148,0.1)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white">Impacto Financeiro do Pipeline</CardTitle>
        <p className="text-xs text-gray-500">
          Dores financeiras mapeadas em {data.callsWithFinancialData} chamadas com análise de IA
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="p-4 rounded-xl border animate-chart-in opacity-0"
            style={{ backgroundColor: `${NEON_GREEN}08`, borderColor: `${NEON_GREEN}20` }}
          >
            <p className="text-xs text-gray-500 mb-1">Perda Mensal Estimada</p>
            <p className="text-2xl font-bold" style={{ color: NEON_GREEN }}>
              {formatBRL(data.totalMonthlyLoss)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Agregado dos leads</p>
          </div>
          <div
            className="p-4 rounded-xl border animate-chart-in opacity-0"
            style={{ backgroundColor: `${NEON_GREEN}08`, borderColor: `${NEON_GREEN}20`, animationDelay: '80ms' }}
          >
            <p className="text-xs text-gray-500 mb-1">Perda Anual Estimada</p>
            <p className="text-2xl font-bold" style={{ color: NEON_GREEN }}>
              {formatBRL(data.totalAnnualLoss)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Oportunidade total</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          * Valores extraídos e estimados pela IA com base nos relatos dos leads. Use como referência estratégica.
        </p>
      </CardContent>
    </Card>
  )
}
