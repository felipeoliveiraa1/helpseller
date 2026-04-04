export type AnalyticsPeriod = '7d' | '30d' | '90d'

export interface AnalyticsKPIs {
  totalCalls: number
  realConversionRate: number
  avgAdherenceScore: number
  avgDurationMin: number
  totalHours: string
  callsToday: number
}

export interface PipelineFunnel {
  converted: number
  followUp: number
  lost: number
  unknown: number
}

export interface TemperatureDistribution {
  frio: number
  morno: number
  quente: number
  fechando: number
}

export interface SentimentDistribution {
  positive: number
  neutral: number
  negative: number
  mixed: number
}

export interface SellerPerformanceRow {
  userId: string
  fullName: string
  totalCalls: number
  conversionRate: number
  avgAdherence: number
  avgSentimentScore: number
  hotLeads: number
  avgDurationMin: number
  isActive: boolean
  needsCoaching: boolean
}

export interface CoachingAlert {
  userId: string
  fullName: string
  reason: string
  metric: string
  severity: 'high' | 'medium'
}

export interface FinancialImpact {
  totalMonthlyLoss: number
  totalAnnualLoss: number
  callsWithFinancialData: number
}

export interface PainPointAggregate {
  pain: string
  count: number
}

export interface ScriptAdherenceData {
  teamAverage: number
  sellers: { fullName: string; avgAdherence: number; callCount: number }[]
}

export interface ManagerAnalyticsData {
  kpis: AnalyticsKPIs
  pipeline: PipelineFunnel
  temperature: TemperatureDistribution
  sentiment: SentimentDistribution
  sellers: SellerPerformanceRow[]
  coachingAlerts: CoachingAlert[]
  financial: FinancialImpact
  painPoints: PainPointAggregate[]
  adherence: ScriptAdherenceData
  monthlyData: { name: string; total: number }[]
  weeklyData: { day: string; total: number }[]
}
