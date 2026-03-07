'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OrgNullForm } from '@/components/org-null-form'
import { OrgCompleteBanner } from '@/components/org-complete-banner'
import { PaywallScreen } from '@/components/paywall-screen'
import { Loader2 } from 'lucide-react'

const FREE_ALLOWED_ROUTES = ['/billing', '/billing/success', '/billing/cancel', '/settings'] as const

function isRouteAllowedForFree(pathname: string): boolean {
  return FREE_ALLOWED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

interface DashboardContentGuardProps {
  children: React.ReactNode
}

export function DashboardContentGuard({ children }: DashboardContentGuardProps) {
  const [mounted, setMounted] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null | undefined>(undefined)
  const [organizationPlan, setOrganizationPlan] = useState<string>('FREE')
  const pathname = usePathname()
  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setOrganizationId(null)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    const orgId = (profile as { organization_id: string | null } | null)?.organization_id ?? null
    setOrganizationId(orgId)
    if (orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', orgId)
        .single()
      setOrganizationPlan((org as { plan?: string } | null)?.plan ?? 'FREE')
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    loadProfile()
  }, [loadProfile])

  if (!mounted || organizationId === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]" suppressHydrationWarning={true}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (organizationId === null) {
    return <OrgNullForm onSuccess={loadProfile} />
  }

  const isFreePlan = organizationPlan === 'FREE' || !organizationPlan
  if (isFreePlan && !isRouteAllowedForFree(pathname)) {
    return <PaywallScreen />
  }

  return (
    <>
      <div className="mb-4">
        <OrgCompleteBanner />
      </div>
      {children}
    </>
  )
}
