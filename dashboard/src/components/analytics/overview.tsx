'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

const NEON_PINK = '#ff007a'

interface OverviewProps {
  monthlyData: { name: string; total: number }[]
  height?: number
}

export function Overview({ monthlyData, height = 256 }: OverviewProps) {
  if (monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className="animate-chart-in opacity-0" style={{ animationDelay: '200ms' }} suppressHydrationWarning={true}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={monthlyData}>
          <XAxis
            dataKey="name"
            stroke="#555"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#555"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1e1e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#999' }}
            formatter={(value: number | undefined) => [value ?? 0, 'Chamadas']}
          />
          <Bar
            dataKey="total"
            fill={NEON_PINK}
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationBegin={400}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
