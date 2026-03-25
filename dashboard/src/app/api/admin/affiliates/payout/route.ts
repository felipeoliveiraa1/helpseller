import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ADMIN_EMAILS = ['felipeoliveiraa1@hotmail.com']

const PayoutActionSchema = z.object({
  payout_id: z.string().uuid('ID de pagamento inválido'),
  action: z.enum(['approve', 'reject'] as const),
  admin_notes: z.string().optional(),
})

async function verifyAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (!ADMIN_EMAILS.includes(user.email ?? '')) return null
  return user
}

/**
 * POST /api/admin/affiliates/payout
 * Approve or reject a payout request. Admin only.
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
    const parsed = PayoutActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { payout_id, action, admin_notes } = parsed.data
    const adminDb = createAdminClient()

    // Get payout record
    const { data: payout, error: fetchError } = await adminDb
      .from('affiliate_payouts')
      .select('*')
      .eq('id', payout_id)
      .single()

    if (fetchError || !payout) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    if (payout.status !== 'requested') {
      return NextResponse.json(
        { error: `Pagamento não pode ser processado (status atual: ${payout.status})` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Mark payout as paid
      const { error: updatePayoutError } = await adminDb
        .from('affiliate_payouts')
        .update({
          status: 'paid',
          admin_notes: admin_notes ?? null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', payout_id)

      if (updatePayoutError) {
        console.error('[ADMIN_PAYOUT] Update payout failed:', updatePayoutError)
        return NextResponse.json(
          { error: 'Falha ao aprovar pagamento' },
          { status: 500 }
        )
      }

      // Update affiliate total_paid_cents
      const { data: affiliate } = await adminDb
        .from('affiliates')
        .select('total_paid_cents')
        .eq('id', payout.affiliate_id)
        .single()

      if (affiliate) {
        await adminDb
          .from('affiliates')
          .update({
            total_paid_cents: (affiliate.total_paid_cents ?? 0) + payout.amount_cents,
          })
          .eq('id', payout.affiliate_id)
      }

      // Mark commissions as 'paid'
      await adminDb
        .from('affiliate_commissions')
        .update({ status: 'paid' })
        .eq('payout_id', payout_id)

      return NextResponse.json({ message: 'Pagamento aprovado com sucesso' })
    }

    // action === 'reject'
    // Mark payout as rejected
    const { error: rejectError } = await adminDb
      .from('affiliate_payouts')
      .update({
        status: 'rejected',
        admin_notes: admin_notes ?? null,
      })
      .eq('id', payout_id)

    if (rejectError) {
      console.error('[ADMIN_PAYOUT] Reject payout failed:', rejectError)
      return NextResponse.json(
        { error: 'Falha ao rejeitar pagamento' },
        { status: 500 }
      )
    }

    // Revert commissions back to 'available'
    await adminDb
      .from('affiliate_commissions')
      .update({ status: 'available', payout_id: null })
      .eq('payout_id', payout_id)

    return NextResponse.json({ message: 'Pagamento rejeitado. Comissões revertidas.' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ADMIN_PAYOUT] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
