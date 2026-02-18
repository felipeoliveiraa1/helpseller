import { NextResponse } from 'next/server';

/**
 * GET /api/health - Diagnóstico: se retornar 200, o app Next está sendo servido pela Vercel.
 * Use para testar se o 404 é geral (esta rota também 404) ou só em páginas.
 */
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Next.js app is running' });
}
