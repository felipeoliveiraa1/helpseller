'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Página raiz "/": redireciona sempre para a landing page (client-side).
 * Evita 404 na Vercel quando redirect() server-side não é aplicado na raiz.
 */
export default function RootPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/landing')
    }, [router])
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-400">
            <p>Redirecionando...</p>
        </div>
    )
}
