'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrgNullForm } from '@/components/org-null-form'
import { OrgCompleteBanner } from '@/components/org-complete-banner'
import { Loader2 } from 'lucide-react'

interface DashboardContentGuardProps {
  children: React.ReactNode
}

export function DashboardContentGuard({ children }: DashboardContentGuardProps) {
  const [mounted, setMounted] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null | undefined>(undefined)
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
    setOrganizationId((profile as { organization_id: string | null } | null)?.organization_id ?? null)
  }, [])

  useEffect(() => {
    setMounted(true)
    loadProfile()
  }, [loadProfile])

  if (!mounted || organizationId === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (organizationId === null) {
    return <OrgNullForm onSuccess={loadProfile} />
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
