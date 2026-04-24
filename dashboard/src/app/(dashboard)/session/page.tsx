'use client'

import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useWebSession } from '@/hooks/use-web-session'
import { usePictureInPicture } from '@/hooks/use-picture-in-picture'
import { SessionConfigForm } from '@/components/session/session-config'
import { SessionPanel } from '@/components/session/session-panel'
import { PipPopupContent } from '@/components/session/pip-popup-content'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import type { SessionConfig, CallResult } from '@/hooks/use-web-session'

const NEON_PINK = '#ff007a'
const PIP_WIDTH = 380
const PIP_HEIGHT = 700

export default function SessionPage() {
  const { state, start, stop, dismissCoachMessage, reset } = useWebSession()
  const pip = usePictureInPicture()

  const openPip = useCallback(async () => {
    await pip.open({
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
      fallbackUrl: '/session/live',
      fallbackName: 'helpcloser-session',
    })
  }, [pip])

  const togglePip = useCallback(() => {
    if (pip.isOpen) pip.close()
    else openPip()
  }, [pip, openPip])

  const handleStart = useCallback(async (config: SessionConfig) => {
    await openPip()
    start(config)
  }, [start, openPip])

  const handleReset = useCallback(() => {
    pip.close()
    reset()
  }, [pip, reset])

  const handleStop = useCallback((result: CallResult) => { stop(result) }, [stop])

  // Config screen
  if (state.status === 'idle') {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Sessão" />
        <div className="px-6 pb-6">
          <SessionConfigForm onStart={handleStart} />
        </div>
      </div>
    )
  }

  // Active / ending / ended / error
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Sessão" />
      <div className="px-6 pb-6">
        {/* PiP toggle */}
        {(state.status === 'active' || state.status === 'connecting' || state.status === 'configuring') && (
          <div className="flex justify-end mb-3">
            <button
              onClick={togglePip}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
              style={{
                backgroundColor: pip.isOpen ? `${NEON_PINK}15` : 'rgba(255,255,255,0.05)',
                borderColor: pip.isOpen ? `${NEON_PINK}40` : 'rgba(255,255,255,0.05)',
                color: pip.isOpen ? NEON_PINK : '#999',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4.5v5H3m-1-6 6 6m13 0v-3c0-1.16-.84-2-2-2h-7m-9 9v2c0 1.05.95 2 2 2h3" />
                <rect width="10" height="7" x="12" y="13.5" ry="2" />
              </svg>
              {pip.isOpen ? 'Popup Ativo (Sempre Visível)' : 'Abrir Popup Flutuante'}
            </button>
          </div>
        )}

        <SessionPanel
          state={state}
          onStop={stop}
          onDismissCoachMessage={dismissCoachMessage}
          onReset={handleReset}
        />
      </div>

      {/*
        When the browser supports Document Picture-in-Picture, render the popup
        content directly into the PiP window via createPortal — no separate route,
        no BroadcastChannel, no Chrome tab chrome.
        For older browsers, pip.container is null and the fallback window.open
        loads /session/live which has its own rendering via BroadcastChannel.
      */}
      {pip.container && createPortal(
        <PipPopupContent
          state={state}
          onDismiss={dismissCoachMessage}
          onStop={handleStop}
        />,
        pip.container
      )}
    </div>
  )
}
