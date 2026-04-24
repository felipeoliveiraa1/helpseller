'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OrgNullForm } from '@/components/org-null-form'
import { OrgCompleteBanner } from '@/components/org-complete-banner'
import { PaywallScreen } from '@/components/paywall-screen'
import { PlanProvider, FeatureGate, LimitWarning, useLimitWarnings, usePlanContext } from '@/components/feature-gate'
import { getRequiredFeature, type FeatureKey } from '@/lib/plan-limits'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

const FREE_ALLOWED_ROUTES = ['/billing', '/billing/success', '/billing/cancel', '/settings'] as const

// Module-level cache to skip guard queries between navigations within the dashboard
type CachedProfile = {
  organizationId: string | null
  organizationPlan: string
  isDeactivated: boolean
  fetchedAt: number
}
let _profileCache: CachedProfile | null = null
let _profileInflight: Promise<CachedProfile> | null = null
const PROFILE_CACHE_TTL = 60_000
const PROFILE_LOAD_TIMEOUT = 8000

/**
 * Clears the in-memory profile cache. Call this on sign-out so a new user
 * signing in from the same tab doesn't inherit the previous account's org/plan.
 */
export function clearProfileCache(): void {
  _profileCache = null
  _profileInflight = null
}

function TrialBanner({ organizationId }: { organizationId: string }) {
  const [usage, setUsage] = useState<{ usedMinutes: number; totalMinutes: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUsage() {
      // Get total call minutes for this org (all time for TRIAL, not monthly)
      const { data } = await supabase
        .from('calls')
        .select('duration_seconds')
        .eq('organization_id', organizationId)
        .eq('status', 'COMPLETED')

      const totalSeconds = (data || []).reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0)
      setUsage({ usedMinutes: Math.round(totalSeconds / 60), totalMinutes: 60 })
    }
    fetchUsage()
  }, [organizationId, supabase])

  if (!usage) return null

  const remaining = Math.max(0, usage.totalMinutes - usage.usedMinutes)
  const percentage = Math.min(100, (usage.usedMinutes / usage.totalMinutes) * 100)
  const isLow = remaining <= 15
  const isExhausted = remaining <= 0

  return (
    <div className={`rounded-xl border px-4 py-3 mb-4 ${
      isExhausted ? 'border-red-500/30 bg-red-500/10' :
      isLow ? 'border-amber-500/30 bg-amber-500/10' :
      'border-blue-500/20 bg-blue-500/5'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`material-icons-outlined text-lg ${
            isExhausted ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {isExhausted ? 'error' : isLow ? 'warning' : 'rocket_launch'}
          </span>
          <div>
            <p className={`text-sm font-medium ${
              isExhausted ? 'text-red-200' : isLow ? 'text-amber-200' : 'text-blue-200'
            }`}>
              {isExhausted
                ? 'Seu trial gratuito acabou'
                : `Plano Trial — ${remaining} min restantes de 1h gratuita`}
            </p>
            {!isExhausted && (
              <div className="mt-1.5 w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isLow ? 'bg-amber-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <Link
          href="/billing"
          className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110"
          style={{ backgroundColor: '#ff007a' }}
        >
          {isExhausted ? 'Assinar agora' : 'Fazer upgrade'}
        </Link>
      </div>
    </div>
  )
}

function isRouteAllowedForFree(pathname: string): boolean {
  return FREE_ALLOWED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

interface DashboardContentGuardProps {
  children: React.ReactNode
}

function LimitWarnings() {
  const warnings = useLimitWarnings()

  return (
    <>
      {(warnings.sellers.isAtLimit || warnings.sellers.isNearLimit) && (
        <LimitWarning
          type="sellers"
          current={warnings.sellers.current}
          max={warnings.sellers.max}
        />
      )}
      {(warnings.hours.isAtLimit || warnings.hours.isNearLimit) && (
        <LimitWarning
          type="hours"
          current={warnings.hours.current}
          max={warnings.hours.max}
        />
      )}
    </>
  )
}

function RouteFeatureGuard({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const requiredFeature = getRequiredFeature(pathname)

  // No feature required for this route
  if (!requiredFeature) {
    return <>{children}</>
  }

  return (
    <FeatureGate feature={requiredFeature}>
      {children}
    </FeatureGate>
  )
}

export function DashboardContentGuard({ children }: DashboardContentGuardProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null | undefined>(undefined)
  const [organizationPlan, setOrganizationPlan] = useState<string | null>(null) // null = not loaded yet
  const [isDeactivated, setIsDeactivated] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null

  const applyCached = useCallback((cached: CachedProfile) => {
    setOrganizationId(cached.organizationId)
    setOrganizationPlan(cached.organizationPlan)
    setIsDeactivated(cached.isDeactivated)
    setLoading(false)
  }, [])

  const loadProfile = useCallback(async (opts: { force?: boolean } = {}) => {
    if (!opts.force && _profileCache && Date.now() - _profileCache.fetchedAt < PROFILE_CACHE_TTL) {
      applyCached(_profileCache)
      return
    }

    const doFetch = async (): Promise<CachedProfile> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { organizationId: null, organizationPlan: 'FREE', isDeactivated: false, fetchedAt: Date.now() }
      }
      // Single round-trip: profile + organization via Supabase join
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, is_active, organizations(plan)')
        .eq('id', user.id)
        .single()

      const isActive = (profile as any)?.is_active
      if (isActive === false) {
        await supabase.auth.signOut()
        return { organizationId: null, organizationPlan: 'FREE', isDeactivated: true, fetchedAt: Date.now() }
      }

      const p = profile as { organization_id: string | null; organizations?: { plan?: string } | { plan?: string }[] } | null
      const orgRel = Array.isArray(p?.organizations) ? p?.organizations[0] : p?.organizations
      return {
        organizationId: p?.organization_id ?? null,
        organizationPlan: orgRel?.plan ?? 'FREE',
        isDeactivated: false,
        fetchedAt: Date.now(),
      }
    }

    try {
      if (!_profileInflight) {
        _profileInflight = doFetch()
          .then((result) => { _profileCache = result; return result })
          .finally(() => { _profileInflight = null })
      }

      const timeout = new Promise<CachedProfile>((resolve) => {
        setTimeout(() => resolve({
          organizationId: _profileCache?.organizationId ?? null,
          organizationPlan: _profileCache?.organizationPlan ?? 'FREE',
          isDeactivated: false,
          fetchedAt: Date.now(),
        }), PROFILE_LOAD_TIMEOUT)
      })

      const result = await Promise.race([_profileInflight, timeout])
      applyCached(result)
    } catch {
      applyCached({ organizationId: null, organizationPlan: 'FREE', isDeactivated: false, fetchedAt: Date.now() })
    } finally {
      setLoading(false)
    }
  }, [applyCached])

  useEffect(() => {
    setMounted(true)
    loadProfile()
  }, [loadProfile])

  // Deactivated users — check BEFORE loading spinner to avoid infinite spinner
  if (isDeactivated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Conta desativada</h2>
        <p className="text-gray-400 max-w-md">
          Sua conta foi desativada pelo administrador da sua equipe. Entre em contato com o gestor para mais informações.
        </p>
      </div>
    )
  }

  // Show loading while mounting, loading data, or plan not yet determined
  if (!mounted || loading || organizationId === undefined || organizationPlan === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]" suppressHydrationWarning={true}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (organizationId === null) {
    return <OrgNullForm onSuccess={loadProfile} />
  }

  const isFreePlan = (organizationPlan === 'FREE' || !organizationPlan) && organizationPlan !== 'TRIAL'
  if (isFreePlan && !isRouteAllowedForFree(pathname)) {
    return <PaywallScreen />
  }

  return (
    <PlanProvider>
      {organizationPlan === 'TRIAL' && organizationId && (
        <TrialBanner organizationId={organizationId} />
      )}
      <div className="mb-4">
        <OrgCompleteBanner />
      </div>
      <LimitWarnings />
      <RouteFeatureGuard pathname={pathname}>
        {children}
      </RouteFeatureGuard>
    </PlanProvider>
  )
}
