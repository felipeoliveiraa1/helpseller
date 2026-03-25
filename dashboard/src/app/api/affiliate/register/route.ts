import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const BodySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
  pix_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'] as const),
  how_promote: z.string().min(1, 'Informe como pretende divulgar'),
})

function generateAffiliateCode(name: string): string {
  const firstName = name.trim().split(/\s+/)[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${firstName}${random}`
}

/**
 * POST /api/affiliate/register
 * Public endpoint - registers a new affiliate application.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, phone, pix_key, pix_type, how_promote } = parsed.data
    const adminDb = createAdminClient()

    // Check if email already registered as affiliate
    const { data: existing } = await adminDb
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado como afiliado' },
        { status: 409 }
      )
    }

    const code = generateAffiliateCode(name)

    const { data: affiliate, error: insertError } = await adminDb
      .from('affiliates')
      .insert({
        name,
        email,
        phone,
        pix_key,
        pix_type,
        how_promote,
        code,
        status: 'pending',
        user_id: null,
        total_earned_cents: 0,
        total_paid_cents: 0,
      })
      .select('id, code')
      .single()

    if (insertError) {
      console.error('[AFFILIATE_REGISTER] Insert failed:', insertError)
      return NextResponse.json(
        { error: 'Falha ao registrar afiliado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação.',
      affiliate_id: affiliate.id,
      code: affiliate.code,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AFFILIATE_REGISTER] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
