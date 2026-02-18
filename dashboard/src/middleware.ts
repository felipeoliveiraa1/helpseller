/**
 * Middleware em modo pass-through (desabilitado) para testar se o 404 na Vercel
 * é causado por redirect/rewrite do middleware.
 * Se o 404 sumir após deploy: o problema era o middleware. Reative de middleware.disabled.ts.
 */
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    return NextResponse.next({
        request: { headers: request.headers },
    })
}

export const config = {
    matcher: [
        '/',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
