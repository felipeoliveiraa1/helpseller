import { redirect } from 'next/navigation'

/**
 * Página raiz "/": redireciona sempre para a landing page.
 * Garante que a home nunca retorne 404 na Vercel.
 */
export default function RootPage() {
    redirect('/landing')
}
