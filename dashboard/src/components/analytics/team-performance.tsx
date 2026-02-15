'use client'

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const NEON_PINK = '#ff007a'
const NEON_GREEN = '#00ff94'
const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }

export interface SellerStat {
    userId: string
    fullName: string
    totalCalls: number
    avgDurationMin: number
    isActive: boolean
}

interface TeamPerformanceProps {
    sellers: SellerStat[]
    weeklyData: { day: string; total: number }[]
    totalHours: string
    successRate: number
}

export function TeamPerformance({ sellers, weeklyData, totalHours, successRate }: TeamPerformanceProps) {
    const sorted = [...sellers].sort((a, b) => b.totalCalls - a.totalCalls)

    return (
        <div className="grid gap-4 md:grid-cols-7" suppressHydrationWarning={true}>
            {/* Ranking Table */}
            <Card className="col-span-4 rounded-2xl border shadow-none" style={CARD_STYLE}>
                <CardHeader>
                    <CardTitle className="text-base font-bold text-white">Ranking de Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                    {sorted.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum vendedor com chamadas este mês.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-gray-500 font-medium pb-3 pl-1">#</th>
                                        <th className="text-left text-gray-500 font-medium pb-3">Vendedor</th>
                                        <th className="text-right text-gray-500 font-medium pb-3">Chamadas</th>
                                        <th className="text-right text-gray-500 font-medium pb-3">Tempo Médio</th>
                                        <th className="text-right text-gray-500 font-medium pb-3 pr-1">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((seller, i) => (
                                        <tr key={seller.userId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 pl-1">
                                                <span className={`text-xs font-bold w-5 h-5 inline-flex items-center justify-center rounded-full ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        i === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                            i === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-white/5 text-gray-500'
                                                    }`}>{i + 1}</span>
                                            </td>
                                            <td className="py-3 text-white font-medium">
                                                {seller.fullName}
                                            </td>
                                            <td className="py-3 text-right text-white tabular-nums">{seller.totalCalls}</td>
                                            <td className="py-3 text-right text-gray-400 tabular-nums">{seller.avgDurationMin} min</td>
                                            <td className="py-3 text-right pr-1">
                                                {seller.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-gray-500">Offline</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Right Column: Trend + Stats */}
            <div className="col-span-3 space-y-4">
                {/* Weekly Trend */}
                <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-white">Volume Semanal</CardTitle>
                    </CardHeader>
                    <CardContent suppressHydrationWarning={true}>
                        {weeklyData.length === 0 ? (
                            <p className="text-gray-500 text-sm h-32 flex items-center justify-center">Sem dados</p>
                        ) : (
                            <div className="animate-chart-in opacity-0" style={{ animationDelay: '300ms' }}>
                                <ResponsiveContainer width="100%" height={140}>
                                    <LineChart data={weeklyData}>
                                        <XAxis
                                            dataKey="day"
                                            stroke="#555"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#555"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={30}
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
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke={NEON_PINK}
                                            strokeWidth={2}
                                            dot={{ fill: NEON_PINK, r: 3 }}
                                            activeDot={{ r: 5, fill: NEON_PINK }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
                        <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-gray-500 font-medium mb-1">Total em Calls</p>
                            <p className="text-2xl font-bold text-white">{totalHours}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
                        <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-gray-500 font-medium mb-1">Taxa de Sucesso</p>
                            <p className="text-2xl font-bold" style={{ color: successRate >= 50 ? NEON_GREEN : NEON_PINK }}>
                                {successRate}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
