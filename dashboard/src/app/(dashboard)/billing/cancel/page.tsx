'use client'

import Link from 'next/link'
import { XCircle, ArrowRight } from 'lucide-react'

const NEON_PINK = '#ff007a'

export default function BillingCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(255,0,122,0.1)', border: '2px solid rgba(255,0,122,0.2)' }}
      >
        <XCircle className="w-10 h-10" style={{ color: NEON_PINK }} />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Checkout cancelado</h1>
      <p className="text-gray-400 max-w-md mb-8">
        O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
        Você pode tentar novamente quando quiser.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: NEON_PINK }}
        >
          Ver planos <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
