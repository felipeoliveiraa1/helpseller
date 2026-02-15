'use client'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { ObjectionAnalytics } from '@/components/analytics/objection-analytics'
import { SellerDashboard } from '@/components/analytics/seller-dashboard'
import { Overview } from '@/components/analytics/overview'
import { RecentCalls } from '@/components/analytics/recent-calls'
import { TeamPerformance, type SellerStat } from '@/components/analytics/team-performance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const NEON_PINK = '#ff007a'
const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }

interface AnalyticsData {
  totalCalls: number
  completedCalls: number
  failedCalls: number
  callsToday: number
  avgDurationMin: number
  conversionRate: number
  monthlyData: { name: string; total: number }[]
  recentCalls: { id: string; full_name: string; ended_at: string; duration_min: number }[]
  // NEW: Team stats
  teamSellers: SellerStat[]
  weeklyData: { day: string; total: number }[]
  totalHours: string
  successRate: number
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    totalCalls: 0, completedCalls: 0, failedCalls: 0,
    callsToday: 0, avgDurationMin: 0, conversionRate: 0,
    monthlyData: [], recentCalls: [],
    teamSellers: [], weeklyData: [], totalHours: '0h 0m', successRate: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)

    async function fetchAll() {
      // 1. Auth + Role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      const userRole = (profile as any)?.role || 'SELLER'
      const orgId = (profile as any)?.organization_id || null
      setRole(userRole)

      const isSeller = userRole === 'SELLER'
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // 2. Total completed calls this month
      let completedQuery = supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
        .gte('started_at', firstOfMonth)
      if (isSeller) completedQuery = completedQuery.eq('user_id', user.id)
      else if (orgId) completedQuery = completedQuery.eq('organization_id', orgId)
      const { count: completedCount } = await completedQuery
      const completed = completedCount ?? 0

      // 3. Failed calls this month
      let failedQuery = supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'FAILED')
        .gte('started_at', firstOfMonth)
      if (isSeller) failedQuery = failedQuery.eq('user_id', user.id)
      else if (orgId) failedQuery = failedQuery.eq('organization_id', orgId)
      const { count: failedCount } = await failedQuery
      const failed = failedCount ?? 0

      const total = completed + failed
      const conversion = total > 0 ? Math.round((completed / total) * 100) : 0

      // 4. Calls today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      let todayQuery = supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
        .gte('started_at', startOfDay)
      if (isSeller) todayQuery = todayQuery.eq('user_id', user.id)
      else if (orgId) todayQuery = todayQuery.eq('organization_id', orgId)
      const { count: todayCount } = await todayQuery
      const today = todayCount ?? 0

      // 5. Average duration (fetch started_at, ended_at for completed calls)
      let durationQuery = supabase
        .from('calls')
        .select('started_at, ended_at')
        .eq('status', 'COMPLETED')
        .gte('started_at', firstOfMonth)
        .limit(500)
      if (isSeller) durationQuery = durationQuery.eq('user_id', user.id)
      else if (orgId) durationQuery = durationQuery.eq('organization_id', orgId)
      const { data: durationCalls } = await durationQuery

      let avgMin = 0
      let totalSeconds = 0
      if (durationCalls && durationCalls.length > 0) {
        const withEnd = durationCalls.filter((c: any) => c.ended_at != null)
        if (withEnd.length > 0) {
          totalSeconds = withEnd.reduce((sum: number, c: any) => {
            const start = new Date(c.started_at).getTime()
            const end = new Date(c.ended_at).getTime()
            return sum + Math.max(0, (end - start) / 1000)
          }, 0)
          avgMin = Math.round(totalSeconds / withEnd.length / 60 * 10) / 10
        }
      }

      // Format total hours
      const totalMinutes = Math.floor(totalSeconds / 60)
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      const totalHours = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

      // 6. Monthly data (last 6 months)
      const monthlyData: { name: string; total: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = d.toISOString()
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()

        let mQuery = supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'COMPLETED')
          .gte('started_at', monthStart)
          .lt('started_at', monthEnd)
        if (isSeller) mQuery = mQuery.eq('user_id', user.id)
        else if (orgId) mQuery = mQuery.eq('organization_id', orgId)
        const { count: mCount } = await mQuery

        monthlyData.push({ name: MONTH_NAMES[d.getMonth()], total: mCount ?? 0 })
      }

      // 7. Recent calls (last 5 completed)
      let recentQuery = supabase
        .from('calls')
        .select('id, started_at, ended_at, user:profiles!user_id(full_name)')
        .eq('status', 'COMPLETED')
        .order('ended_at', { ascending: false })
        .limit(5)
      if (isSeller) recentQuery = recentQuery.eq('user_id', user.id)
      else if (orgId) recentQuery = recentQuery.eq('organization_id', orgId)
      const { data: recent } = await recentQuery

      const recentCalls = (recent || []).map((c: any) => {
        const start = new Date(c.started_at).getTime()
        const end = c.ended_at ? new Date(c.ended_at).getTime() : start
        return {
          id: c.id,
          full_name: c.user?.full_name || 'Vendedor',
          ended_at: c.ended_at || c.started_at,
          duration_min: Math.round((end - start) / 60000 * 10) / 10,
        }
      })

      // ====================================
      // 8. TEAM STATS (Manager/Admin only)
      // ====================================
      let teamSellers: SellerStat[] = []
      let weeklyData: { day: string; total: number }[] = []

      if (!isSeller && orgId) {
        // 8a. Fetch all calls this month with user info, grouped client-side
        let teamQuery = supabase
          .from('calls')
          .select('user_id, started_at, ended_at, status, user:profiles!user_id(full_name)')
          .gte('started_at', firstOfMonth)
          .eq('organization_id', orgId)
          .limit(1000)
        const { data: teamCalls } = await teamQuery

        if (teamCalls && teamCalls.length > 0) {
          // Group by user_id
          const byUser: Record<string, { fullName: string; calls: any[] }> = {}
          for (const call of teamCalls as any[]) {
            const uid = call.user_id
            if (!byUser[uid]) {
              byUser[uid] = {
                fullName: call.user?.full_name || 'Vendedor',
                calls: [],
              }
            }
            byUser[uid].calls.push(call)
          }

          // Check who has active calls
          const { data: activeCalls } = await supabase
            .from('calls')
            .select('user_id')
            .eq('status', 'ACTIVE')
            .eq('organization_id', orgId)

          const activeUserIds = new Set((activeCalls || []).map((c: any) => c.user_id))

          teamSellers = Object.entries(byUser).map(([uid, info]) => {
            const completedCalls = info.calls.filter((c: any) => c.status === 'COMPLETED')
            let totalDurSec = 0
            for (const c of completedCalls) {
              if (c.ended_at) {
                totalDurSec += Math.max(0, (new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000)
              }
            }
            const avg = completedCalls.length > 0 ? Math.round(totalDurSec / completedCalls.length / 60 * 10) / 10 : 0

            return {
              userId: uid,
              fullName: info.fullName,
              totalCalls: completedCalls.length,
              avgDurationMin: avg,
              isActive: activeUserIds.has(uid),
            }
          })
        }

        // 8b. Weekly data (last 7 days)
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
          const dayStart = d.toISOString()
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()

          let wQuery = supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'COMPLETED')
            .gte('started_at', dayStart)
            .lt('started_at', dayEnd)
            .eq('organization_id', orgId)
          const { count: wCount } = await wQuery

          weeklyData.push({ day: DAY_NAMES[d.getDay()], total: wCount ?? 0 })
        }
      }

      setData({
        totalCalls: total,
        completedCalls: completed,
        failedCalls: failed,
        callsToday: today,
        avgDurationMin: avgMin,
        conversionRate: conversion,
        monthlyData,
        recentCalls,
        teamSellers,
        weeklyData,
        totalHours,
        successRate: conversion,
      })
      setLoading(false)
    }

    fetchAll()
  }, [])

  if (!mounted || loading) {
    return (
      <div className="space-y-6" suppressHydrationWarning={true}>
        <DashboardHeader title="Analytics" />
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl" style={CARD_STYLE} />
            ))}
          </div>
          <div className="h-72 rounded-2xl" style={CARD_STYLE} />
          <div className="grid gap-4 md:grid-cols-7">
            <div className="col-span-4 h-64 rounded-2xl" style={CARD_STYLE} />
            <div className="col-span-3 h-64 rounded-2xl" style={CARD_STYLE} />
          </div>
        </div>
      </div>
    )
  }

  // ---------- SELLER VIEW ----------
  if (role === 'SELLER') {
    return (
      <div suppressHydrationWarning={true}>
        <DashboardHeader title="Analytics" />
        <SellerDashboard stats={{ callsToday: data.callsToday, conversionRate: data.conversionRate }} />
      </div>
    )
  }

  // ---------- MANAGER / ADMIN VIEW ----------
  return (
    <div className="space-y-6" suppressHydrationWarning={true}>
      <DashboardHeader title="Analytics" />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Chamadas</CardTitle>
            <span className="material-icons-outlined text-gray-500 text-[20px]">call</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.totalCalls.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-gray-500 mt-1">Concluídas este mês</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Taxa de Conversão</CardTitle>
            <span className="material-icons-outlined text-gray-500 text-[20px]">trending_up</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: data.conversionRate >= 50 ? '#00ff94' : NEON_PINK }}>
              {data.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Concluídas / Total</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tempo Médio</CardTitle>
            <span className="material-icons-outlined text-gray-500 text-[20px]">schedule</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.avgDurationMin} min</div>
            <p className="text-xs text-gray-500 mt-1">Duração média por chamada</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-none" style={CARD_STYLE}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total em Calls</CardTitle>
            <span className="material-icons-outlined text-gray-500 text-[20px]">hourglass_top</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.totalHours}</div>
            <p className="text-xs text-gray-500 mt-1">Tempo total de ligações</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4 rounded-2xl border shadow-none" style={CARD_STYLE}>
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Chamadas por Mês</CardTitle>
          </CardHeader>
          <CardContent className="pl-2" suppressHydrationWarning={true}>
            <Overview monthlyData={data.monthlyData} />
          </CardContent>
        </Card>
        <Card className="col-span-3 rounded-2xl border shadow-none" style={CARD_STYLE}>
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Chamadas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentCalls calls={data.recentCalls} />
          </CardContent>
        </Card>
      </div>

      {/* Team Performance (Ranking + Weekly Trend) */}
      <TeamPerformance
        sellers={data.teamSellers}
        weeklyData={data.weeklyData}
        totalHours={data.totalHours}
        successRate={data.successRate}
      />

      {/* Objection Analytics */}
      <div className="grid gap-4">
        <ObjectionAnalytics />
      </div>
    </div>
  )
}
