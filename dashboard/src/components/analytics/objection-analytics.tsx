import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const MOCK_ANALYTICS = [
    { objection: "Está muito caro", successRate: 78, usageCount: 145, bestResponse: "Focar no ROI e custo de inação" },
    { objection: "Preciso falar com meu sócio", successRate: 45, usageCount: 98, bestResponse: "Agendar reunião conjunta" },
    { objection: "Já usamos o concorrente X", successRate: 62, usageCount: 88, bestResponse: "Diferencial exclusivo de migração" },
    { objection: "Não temos orçamento agora", successRate: 30, usageCount: 65, bestResponse: "Plano trimestral flexível" },
]

export function ObjectionAnalytics() {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>Analytics de Objeções</CardTitle>
                <CardDescription>
                    Eficácia das respostas para as objeções mais comuns
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {MOCK_ANALYTICS.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium text-base">{item.objection}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Usada {item.usageCount} vezes • Melhor resposta: <span className="font-semibold text-emerald-600">{item.bestResponse}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{item.successRate}%</div>
                                    <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
                                </div>
                            </div>
                            <Progress value={item.successRate} className="h-2"
                                indicatorClassName={
                                    item.successRate > 70 ? "bg-emerald-500" :
                                        item.successRate > 50 ? "bg-amber-500" : "bg-red-500"
                                }
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
