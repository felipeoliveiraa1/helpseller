'use client'

import type { AnalyticsPeriod } from '@/types/analytics'

const OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
]

interface PeriodFilterProps {
  value: AnalyticsPeriod
  onChange: (p: AnalyticsPeriod) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border p-1" style={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.08)' }}>
      {OPTIONS.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: active ? '#ff007a' : 'transparent',
              color: active ? '#fff' : '#888',
              boxShadow: active ? '0 0 10px rgba(255,0,122,0.3)' : 'none',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
