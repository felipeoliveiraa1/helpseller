'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { CallResult } from '@/hooks/use-web-session'

const NEON_PINK = '#ff007a'

interface SessionControlsProps {
  duration: number
  callId: string | null
  micAvailable: boolean
  onStop: (result: CallResult) => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SessionControls({ duration, callId, micAvailable, onStop }: SessionControlsProps) {
  const [showResultPicker, setShowResultPicker] = useState(false)

  const handleStop = (result: CallResult) => {
    setShowResultPicker(false)
    onStop(result)
  }

  return (
    <div className="border-t border-white/5 bg-black/40 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Status indicators */}
        <div className="flex items-center gap-4">
          {/* Recording indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono font-bold text-white">{formatDuration(duration)}</span>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="material-icons-outlined text-sm text-green-500">wifi</span>
            <span>Conectado</span>
          </div>

          {/* Mic status */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="material-icons-outlined text-sm" style={{ color: micAvailable ? '#22c55e' : '#ef4444' }}>
              {micAvailable ? 'mic' : 'mic_off'}
            </span>
            <span>{micAvailable ? 'Microfone ativo' : 'Sem microfone'}</span>
          </div>

          {/* Call ID */}
          {callId && (
            <span className="text-[10px] text-gray-600 font-mono">
              ID: {callId.slice(0, 8)}
            </span>
          )}
        </div>

        {/* End button */}
        <div className="relative">
          {!showResultPicker ? (
            <Button
              onClick={() => setShowResultPicker(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 h-10 rounded-xl transition-all"
            >
              <span className="material-icons-outlined text-lg mr-1.5">call_end</span>
              Encerrar
            </Button>
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-xs text-gray-400 mr-1">Resultado:</span>
              <Button
                size="sm"
                onClick={() => handleStop('CONVERTED')}
                className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 rounded-lg"
              >
                Convertido
              </Button>
              <Button
                size="sm"
                onClick={() => handleStop('LOST')}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-3 rounded-lg"
              >
                Perdido
              </Button>
              <Button
                size="sm"
                onClick={() => handleStop('FOLLOW_UP')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs h-8 px-3 rounded-lg"
              >
                Follow-up
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowResultPicker(false)}
                className="text-gray-500 hover:text-white text-xs h-8 px-2"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
