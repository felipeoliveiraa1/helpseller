import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const MINIMUM_PAYOUT_CENTS = 5000 // R$50,00

const PayoutBodySchema = z.object({
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
  pix_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'] as const),
})

/**
 * GET /api/affiliate/payout
 * Returns payout history for the authenticated affiliate.
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

    const { data: payouts, error } = await adminDb
      .from('affiliate_payouts')
      .select('id, amount_cents, pix_key, pix_type, status, admin_notes, created_at, paid_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AFFILIATE_PAYOUT] Query failed:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar pagamentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ payouts: payouts ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AFFILIATE_PAYOUT] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/affiliate/payout
 * Request a payout of available commissions.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = PayoutBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { pix_key, pix_type } = parsed.data
    const adminDb = createAdminClient()

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

    // Get all available commissions
    const { data: availableCommissions, error: commError } = await adminDb
      .from('affiliate_commissions')
      .select('id, amount_cents')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'available')

    if (commError) {
      console.error('[AFFILIATE_PAYOUT] Commissions query failed:', commError)
      return NextResponse.json(
        { error: 'Falha ao buscar comissões disponíveis' },
        { status: 500 }
      )
    }

    const totalAvailable = (availableCommissions ?? []).reduce(
      (sum: number, c: { amount_cents: number }) => sum + c.amount_cents,
      0
    )

    if (totalAvailable < MINIMUM_PAYOUT_CENTS) {
      return NextResponse.json(
        {
          error: `Saldo mínimo para saque é R$${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}. Saldo disponível: R$${(totalAvailable / 100).toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Create payout record
    const { data: payout, error: payoutError } = await adminDb
      .from('affiliate_payouts')
      .insert({
        affiliate_id: affiliate.id,
        amount_cents: totalAvailable,
        pix_key,
        pix_type,
        status: 'requested',
      })
      .select('id')
      .single()

    if (payoutError || !payout) {
      console.error('[AFFILIATE_PAYOUT] Insert failed:', payoutError)
      return NextResponse.json(
        { error: 'Falha ao criar solicitação de pagamento' },
        { status: 500 }
      )
    }

    // Mark commissions as 'requested'
    const commissionIds = (availableCommissions ?? []).map((c: { id: string }) => c.id)
    if (commissionIds.length > 0) {
      const { error: updateError } = await adminDb
        .from('affiliate_commissions')
        .update({ status: 'requested', payout_id: payout.id })
        .in('id', commissionIds)

      if (updateError) {
        console.error('[AFFILIATE_PAYOUT] Update commissions failed:', updateError)
        // Rollback payout record
        await adminDb.from('affiliate_payouts').delete().eq('id', payout.id)
        return NextResponse.json(
          { error: 'Falha ao processar comissões' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'Solicitação de pagamento criada com sucesso!',
      payout_id: payout.id,
      amount_cents: totalAvailable,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AFFILIATE_PAYOUT] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
