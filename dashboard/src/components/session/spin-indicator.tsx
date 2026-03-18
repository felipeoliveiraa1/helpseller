'use client'

const NEON_PINK = '#ff007a'

const SPIN_PHASES: Record<string, { label: string; description: string }> = {
  S: { label: 'Situação', description: 'Coletando fatos sobre o contexto' },
  P: { label: 'Problema', description: 'Descobrindo dores e insatisfações' },
  I: { label: 'Implicação', description: 'Amplificando as consequências' },
  N: { label: 'Necessidade', description: 'Fazendo o cliente verbalizar a solução' },
}

interface SpinIndicatorProps {
  currentPhase: string | null
}

export function SpinIndicator({ currentPhase }: SpinIndicatorProps) {
  if (!currentPhase) return null

  const phase = SPIN_PHASES[currentPhase]
  if (!phase) return null

  return (
    <div className="px-3 py-2 rounded-lg border border-white/5 bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            SPIN:{currentPhase}
          </span>
          <span className="text-[13px] font-medium text-gray-300">
            {phase.label}
          </span>
        </div>
        <div className="flex gap-1">
          {['S', 'P', 'I', 'N'].map(p => (
            <div
              key={p}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: p === currentPhase ? NEON_PINK : 'rgba(255,255,255,0.1)',
                boxShadow: p === currentPhase ? `0 0 6px ${NEON_PINK}50` : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <p className="text-[11px] mt-1 text-gray-500">{phase.description}</p>
    </div>
  )
}
