'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Phone, TrendingUp, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface NextStep {
    task: string
    due: string
    priority: 'high' | 'medium' | 'low'
}

interface SellerDashboardProps {
    stats?: { callsToday: number; conversionRate: number }
}

export function SellerDashboard({ stats: statsProp }: SellerDashboardProps = {}) {
    const [nextSteps, setNextSteps] = useState<NextStep[]>([])
    const [loading, setLoading] = useState(true)
    const [callsToday, setCallsToday] = useState(0)
    const [conversionRate, setConversionRate] = useState(0)
    const supabase = createClient()
    const callsTodayDisplay = statsProp?.callsToday ?? callsToday
    const conversionRateDisplay = statsProp?.conversionRate ?? conversionRate

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }
            if (statsProp === undefined) {
                const now = new Date()
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
                const [todayRes, completedRes, convertedRes] = await Promise.all([
                    supabase
                        .from('calls')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'COMPLETED')
                        .gte('started_at', startOfDay),
                    supabase
                        .from('calls')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'COMPLETED'),
                    supabase
                        .from('call_summaries')
                        .select('call_id', { count: 'exact', head: true })
                        .eq('result', 'CONVERTED'),
                ])
                const today = todayRes.count ?? 0
                const totalCompleted = completedRes.count ?? 0
                const converted = convertedRes.count ?? 0
                setCallsToday(today)
                setConversionRate(totalCompleted > 0 ? Math.round((converted / totalCompleted) * 100) : 0)
            }
            const { data } = await supabase
                .from('call_summaries')
                .select(`
                    next_steps,
                    created_at,
                    call:calls!inner(user_id)
                `)
                .order('created_at', { ascending: false })
                .limit(5)
            if (data) {
                const steps: NextStep[] = []
                data.forEach((summary: { next_steps?: string[] }) => {
                    if (Array.isArray(summary.next_steps)) {
                        summary.next_steps.forEach((step: string) => {
                            steps.push({
                                task: step,
                                due: 'A definir',
                                priority: 'medium'
                            })
                        })
                    }
                })
                setNextSteps(steps.slice(0, 5))
            }
            setLoading(false)
        }
        fetchData()
    }, [supabase, statsProp])

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Meu Painel</h2>

            {/* Quick Stats - Placeholder for now, could be real later */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chamadas Hoje</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{callsTodayDisplay}</div>
                        <p className="text-xs text-muted-foreground">Concluídas hoje</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversionRateDisplay}%</div>
                        <p className="text-xs text-muted-foreground">Concluídas / Total</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Next Steps */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Próximas Tarefas</CardTitle>
                        <CardDescription>Ações geradas a partir das suas chamadas recentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                <p>Carregando tarefas...</p>
                            ) : nextSteps.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
                            ) : (
                                nextSteps.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' :
                                                item.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`} />
                                            <span className="text-sm font-medium">{item.task}</span>
                                        </div>
                                        <Badge variant="outline">{item.due}</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle>Meus Insights</CardTitle>
                        <CardDescription>Dicas baseadas na sua performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 text-amber-900 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div className="text-sm">
                                <span className="font-semibold block mb-1">Dica Geral</span>
                                Continue seguindo os scripts para melhorar sua taxa de conversão.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
