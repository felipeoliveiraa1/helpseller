'use client'

/**
 * Raiz "/" serve o mesmo conteúdo da landing (sem redirect).
 * Evita 404 na Vercel: a rota / entrega HTML real.
 */
export { default } from './landing/page'
