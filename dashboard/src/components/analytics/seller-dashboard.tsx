import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Phone, TrendingUp, AlertCircle } from "lucide-react"

export function SellerDashboard({ stats }: { stats: any }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Meu Painel</h2>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chamadas Hoje</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 vs ontem</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">18%</div>
                        <p className="text-xs text-muted-foreground">+4% vs média</p>
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
                            {[
                                { task: "Enviar proposta comercial para Carlos (Lead #123)", due: "Hoje", priority: "high" },
                                { task: "Agendar demo técnica com TechCorp", due: "Amanhã", priority: "medium" },
                                { task: "Follow-up sobre orçamento - Ana Silva", due: "Em 2 dias", priority: "low" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' :
                                                item.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                        <span className="text-sm font-medium">{item.task}</span>
                                    </div>
                                    <Badge variant="outline">{item.due}</Badge>
                                </div>
                            ))}
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
                                <span className="font-semibold block mb-1">Atenção ao Preço</span>
                                Você tem perdido 40% das vendas na objeção de preço. Tente focar mais no ROI antes de falar valores.
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 text-green-900 rounded-lg flex gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <div className="text-sm">
                                <span className="font-semibold block mb-1">Ótima Abertura!</span>
                                Sua conexão inicial está acima da média da equipe (4.8/5.0). Continue assim!
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
