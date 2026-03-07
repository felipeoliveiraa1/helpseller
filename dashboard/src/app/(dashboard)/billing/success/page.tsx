'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const NEON_GREEN = '#00ff94'
const NEON_PINK = '#ff007a'

export default function BillingSuccessPage() {
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${NEON_GREEN}15`, border: `2px solid ${NEON_GREEN}30` }}
      >
        <CheckCircle2 className="w-10 h-10" style={{ color: NEON_GREEN }} />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Assinatura ativada!</h1>
      <p className="text-gray-400 max-w-md mb-8">
        Seu pagamento foi confirmado e o plano já está ativo. Aproveite todos os recursos do HelpSeller.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: NEON_PINK }}
        >
          Ir para o dashboard <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
        >
          Ver meu plano
        </Link>
      </div>
    </div>
  )
}
