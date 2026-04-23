'use client'

import { useEffect, useRef } from 'react'

const NEON_PINK = '#ff007a'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onCancel])

  if (!open) return null

  const confirmColor =
    variant === 'danger' ? '#dc2626' :
    variant === 'warning' ? '#f59e0b' :
    NEON_PINK

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border p-6 animate-in zoom-in-95 fade-in duration-200"
        style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${confirmColor}15` }}
        >
          <span className="material-icons-outlined text-2xl" style={{ color: confirmColor }}>
            {variant === 'danger' ? 'warning' : variant === 'warning' ? 'help_outline' : 'info'}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white text-center mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">{description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 border border-white/10 hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: confirmColor }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Alert dialog (no cancel button, just OK)
interface AlertDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'error' | 'success' | 'info'
  onClose: () => void
}

export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = 'OK',
  variant = 'info',
  onClose,
}: AlertDialogProps) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const color =
    variant === 'error' ? '#dc2626' :
    variant === 'success' ? '#22c55e' :
    '#3b82f6'

  const icon =
    variant === 'error' ? 'error' :
    variant === 'success' ? 'check_circle' :
    'info'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border p-6 animate-in zoom-in-95 fade-in duration-200"
        style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <span className="material-icons-outlined text-2xl" style={{ color }}>{icon}</span>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">{description}</p>
        )}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
          style={{ backgroundColor: color }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
