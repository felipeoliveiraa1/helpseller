import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/affiliate/commissions
 * Returns list of commissions for the authenticated affiliate.
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

    const { data: commissions, error } = await adminDb
      .from('affiliate_commissions')
      .select('id, amount_cents, source_type, status, available_at, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AFFILIATE_COMMISSIONS] Query failed:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar comissões' },
        { status: 500 }
      )
    }

    return NextResponse.json({ commissions: commissions ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AFFILIATE_COMMISSIONS] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
