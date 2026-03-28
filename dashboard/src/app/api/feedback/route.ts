import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FeedbackSchema = z.object({
  type: z.enum(['bug', 'suggestion', 'praise'] as const),
  title: z.string().min(3, 'Título muito curto').max(200),
  description: z.string().min(10, 'Descreva melhor o feedback').max(5000),
  page_url: z.string().optional(),
})

// POST - Submit feedback (authenticated)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = FeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get user's organization
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const { error } = await admin.from('feedback').insert({
      user_id: user.id,
      organization_id: (profile as any)?.organization_id || null,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      page_url: parsed.data.page_url || null,
      user_agent: request.headers.get('user-agent') || null,
    })

    if (error) {
      console.error('[FEEDBACK] Insert error:', error)
      return NextResponse.json({ error: 'Erro ao enviar feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Feedback enviado com sucesso!' })
  } catch (err) {
    console.error('[FEEDBACK] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - List feedback (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const adminCheck = createAdminClient()
    const { data: adminRow } = await adminCheck
      .from('admin_users')
      .select('id')
      .eq('email', user.email ?? '')
      .maybeSingle()
    if (!adminRow) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('feedback')
      .select('*, user:profiles!user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar feedback' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Update feedback status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const adminCheck = createAdminClient()
    const { data: adminRow } = await adminCheck
      .from('admin_users')
      .select('id')
      .eq('email', user.email ?? '')
      .maybeSingle()
    if (!adminRow) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, priority, admin_notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (admin_notes !== undefined) updates.admin_notes = admin_notes
    if (status === 'resolved') updates.resolved_at = new Date().toISOString()

    const { error } = await admin.from('feedback').update(updates).eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
