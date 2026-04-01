import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Auth callback: troca o code por sessão e redireciona.
 * Handles OAuth (Google), magic links, and password recovery.
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const type = requestUrl.searchParams.get('type')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
        }

        // Check if this is a password recovery flow
        // Supabase sets the session type to 'recovery' in the AMR claims
        const isRecovery = type === 'recovery' ||
            (data?.session as any)?.amr?.some((a: { method: string }) => a.method === 'recovery')

        if (isRecovery) {
            return NextResponse.redirect(new URL('/reset-password', requestUrl.origin))
        }
    }

    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
