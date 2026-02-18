import Landing from './landing/page'

/** Força a raiz a ser server-rendered na Vercel (evita 404 em static) */
export const dynamic = 'force-dynamic'

/**
 * Raiz "/" serve o mesmo conteúdo da landing.
 */
export default function RootPage() {
    return <Landing />
}
