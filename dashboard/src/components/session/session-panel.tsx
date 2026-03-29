'use client'

import { useState } from 'react'
import type { WebSessionState, CallResult } from '@/hooks/use-web-session'
import { TranscriptPanel } from './transcript-panel'
import { CoachingPanel } from './coaching-panel'
import { SessionControls } from './session-controls'

const NEON_PINK = '#ff007a'

interface SessionPanelProps {
  state: WebSessionState
  onStop: (result: CallResult) => void
  onDismissCoachMessage: (id: string) => void
  onReset: () => void
}

export function SessionPanel({ state, onStop, onDismissCoachMessage, onReset }: SessionPanelProps) {
  const [fontSizeOffset, setFontSizeOffset] = useState(0)
  const fs = (base: number) => base + fontSizeOffset
  // Connecting state
  if (state.status === 'connecting' || state.status === 'configuring') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-pink-500 animate-spin" />
          <p className="text-white font-medium">
            {state.status === 'configuring' ? 'Aguardando compartilhamento...' : 'Conectando ao servidor...'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {state.status === 'configuring'
              ? 'Selecione a aba do Google Meet ou Zoom'
              : 'Autenticando e iniciando sessão'}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <span className="material-icons-outlined text-3xl text-red-400">error</span>
          </div>
          <p className="text-white font-medium mb-2">Erro na Sessão</p>
          <p className="text-sm text-gray-400 mb-4">{state.error}</p>
          <button
            onClick={onReset}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: NEON_PINK }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  // Ending state
  if (state.status === 'ending') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-green-500 animate-spin" />
          <p className="text-white font-medium">Finalizando sessão...</p>
          <p className="text-sm text-gray-500 mt-1">Enviando dados e gerando resumo</p>
        </div>
      </div>
    )
  }

  // Ended state
  if (state.status === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <span className="material-icons-outlined text-3xl text-green-400">check_circle</span>
          </div>
          <p className="text-white font-medium text-lg mb-2">Sessão Finalizada</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-1.5">
              <span className="material-icons-outlined text-base">timer</span>
              {Math.floor(state.duration / 60)}min {state.duration % 60}s
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-icons-outlined text-base">chat</span>
              {state.transcript.filter(t => t.isFinal).length} mensagens
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-icons-outlined text-base">psychology</span>
              {state.coachMessages.filter(m => !m.isDismissed).length} sugestões
            </span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onReset}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: NEON_PINK }}
            >
              Nova Sessão
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active session
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Font size controls */}
      <div className="flex justify-end mb-1">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.03]">
          <button
            onClick={() => setFontSizeOffset(Math.max(-2, fontSizeOffset - 1))}
            disabled={fontSizeOffset <= -2}
            className="px-1.5 py-0.5 text-xs font-bold text-gray-500 hover:text-white disabled:opacity-30 transition-colors rounded"
          >A-</button>
          <span className="text-[10px] font-mono text-gray-600 w-5 text-center">
            {fontSizeOffset === 0 ? 'A' : fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}
          </span>
          <button
            onClick={() => setFontSizeOffset(Math.min(4, fontSizeOffset + 1))}
            disabled={fontSizeOffset >= 4}
            className="px-1.5 py-0.5 text-xs font-bold text-gray-500 hover:text-white disabled:opacity-30 transition-colors rounded"
          >A+</button>
        </div>
      </div>

      {/* Main content: 2-column layout */}
      <div className="flex-1 flex gap-0 overflow-hidden rounded-xl border border-white/5" style={{ backgroundColor: '#1e1e1e' }}>
        {/* Left: Transcript */}
        <div className="flex-1 border-r border-white/5">
          <TranscriptPanel transcript={state.transcript} fs={fs} />
        </div>

        {/* Right: Coaching */}
        <div className="w-[380px] shrink-0">
          <CoachingPanel
            messages={state.coachMessages}
            currentSpinPhase={state.currentSpinPhase}
            onDismiss={onDismissCoachMessage}
            fs={fs}
          />
        </div>
      </div>

      {/* Bottom: Controls */}
      <SessionControls
        duration={state.duration}
        callId={state.callId}
        micAvailable={state.micAvailable}
        onStop={onStop}
      />
    </div>
  )
}
