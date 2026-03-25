import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ADMIN_EMAILS = ['felipeoliveiraa1@hotmail.com']

const ActionSchema = z.object({
  affiliate_id: z.string().uuid('ID de afiliado inválido'),
  action: z.enum(['approve', 'reject'] as const),
})

async function verifyAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (!ADMIN_EMAILS.includes(user.email ?? '')) return null
  return user
}

/**
 * GET /api/admin/affiliates
 * Lists all affiliates with metrics. Admin only.
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()

    const { data: affiliates, error } = await adminDb
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN_AFFILIATES] Query failed:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar afiliados' },
        { status: 500 }
      )
    }

    // Enrich with metrics
    const enriched = await Promise.all(
      (affiliates ?? []).map(async (aff: Record<string, unknown>) => {
        const { count: totalReferrals } = await adminDb
          .from('affiliate_referrals')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', aff.id)

        const { count: activeSubscriptions } = await adminDb
          .from('affiliate_referrals')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', aff.id)
          .eq('status', 'active')

        const { data: availableRows } = await adminDb
          .from('affiliate_commissions')
          .select('amount_cents')
          .eq('affiliate_id', aff.id)
          .eq('status', 'available')

        const availableBalanceCents = (availableRows ?? []).reduce(
          (sum: number, r: { amount_cents: number }) => sum + r.amount_cents,
          0
        )

        return {
          ...aff,
          total_referrals: totalReferrals ?? 0,
          active_subscriptions: activeSubscriptions ?? 0,
          available_balance_cents: availableBalanceCents,
        }
      })
    )

    return NextResponse.json({ affiliates: enriched })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ADMIN_AFFILIATES] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/admin/affiliates
 * Approve or reject an affiliate application. Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = ActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { affiliate_id, action } = parsed.data
    const adminDb = createAdminClient()

    // Get affiliate
    const { data: affiliate, error: fetchError } = await adminDb
      .from('affiliates')
      .select('*')
      .eq('id', affiliate_id)
      .single()

    if (fetchError || !affiliate) {
      return NextResponse.json(
        { error: 'Afiliado não encontrado' },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      await adminDb
        .from('affiliates')
        .update({ status: 'rejected' })
        .eq('id', affiliate_id)

      return NextResponse.json({ message: 'Afiliado rejeitado' })
    }

    // action === 'approve'
    // Create auth user with temporary password
    const tempPassword = `HS${crypto.randomUUID().slice(0, 8)}!`

    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
      email: affiliate.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: affiliate.name,
        role: 'affiliate',
      },
    })

    if (authError) {
      console.error('[ADMIN_AFFILIATES] Create user failed:', authError)
      return NextResponse.json(
        { error: `Falha ao criar usuário: ${authError.message}` },
        { status: 500 }
      )
    }

    // Link user_id and activate affiliate
    const { error: updateError } = await adminDb
      .from('affiliates')
      .update({
        user_id: authData.user.id,
        status: 'active',
      })
      .eq('id', affiliate_id)

    if (updateError) {
      console.error('[ADMIN_AFFILIATES] Update failed:', updateError)
      return NextResponse.json(
        { error: 'Falha ao atualizar afiliado' },
        { status: 500 }
      )
    }

    // TODO: Send invite email with temp password

    return NextResponse.json({
      message: 'Afiliado aprovado com sucesso',
      user_id: authData.user.id,
      temp_password: tempPassword, // Return to admin so they can share
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ADMIN_AFFILIATES] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
