import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function anonymizeName(name: string): string {
  if (!name || name.length < 2) return '**'
  return name.substring(0, 2) + '**'
}

/**
 * GET /api/affiliate/referrals
 * Returns list of referrals for the authenticated affiliate.
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Find affiliate record
    const { data: affiliate } = await adminDb
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Registro de afiliado não encontrado' },
        { status: 404 }
      )
    }

    // Get referrals with organization details
    const { data: referrals, error } = await adminDb
      .from('affiliate_referrals')
      .select('id, organization_name, plan, status, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AFFILIATE_REFERRALS] Query failed:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar indicações' },
        { status: 500 }
      )
    }

    const anonymized = (referrals ?? []).map((r: {
      id: string
      organization_name: string | null
      plan: string | null
      status: string
      created_at: string
    }) => ({
      id: r.id,
      organization_name: anonymizeName(r.organization_name ?? ''),
      plan: r.plan,
      status: r.status,
      created_at: r.created_at,
    }))

    return NextResponse.json({ referrals: anonymized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AFFILIATE_REFERRALS] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
