'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

const navSections = [
  {
    label: 'Home',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: 'dashboard' }],
  },
  {
    label: 'App',
    items: [
      { name: 'Chamadas', href: '/calls', icon: 'call' },
      { name: 'Ao Vivo', href: '/live', icon: 'cell_tower' },
      { name: 'Analytics', href: '/analytics', icon: 'bar_chart' },
      { name: 'Equipe', href: '/team', icon: 'people' },
    ],
  },
] as const

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

const NEON_PINK = '#ff007a'

export function Sidebar() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Only resolve user data after mount to prevent server/client divergence
  const displayName = mounted
    ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário')
    : 'Usuário'
  const role = mounted
    ? (user?.user_metadata?.role || 'Membro')
    : 'Membro'

  return (
    <aside
      suppressHydrationWarning={true}
      className="w-64 shrink-0 bg-black border-r border-white/5 flex flex-col"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="p-8 flex items-center gap-3" suppressHydrationWarning={true}>
        <div
          suppressHydrationWarning={true}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: NEON_PINK,
            boxShadow: `0 0 15px rgba(255,0,122,0.4)`,
          }}
        >
          <span className="text-white font-bold text-lg">C</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          CloseIA
        </span>
      </div>

      {/* Navigation: render skeleton or real content based on mounted state */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide" suppressHydrationWarning={true}>
        {!mounted ? (
          /* SKELETON STATE — identical on server & client initial render */
          <div className="space-y-6 pt-2">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="pb-2 px-4 text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      suppressHydrationWarning={true}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    >
                      <div className="w-5 h-5 rounded bg-white/5 animate-pulse" />
                      <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* REAL CONTENT — only rendered after useEffect sets mounted=true */
          navSections.map((section) => {
            const filteredItems = section.items.filter((item) => {
              if (role === 'SELLER') {
                if (['Scripts', 'Equipe', 'Ao Vivo'].includes(item.name))
                  return false
              }
              return true
            })

            if (filteredItems.length === 0) return null

            return (
              <div key={section.label}>
                <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest first:pt-0">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = isActivePath(pathname, item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        suppressHydrationWarning={true}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors',
                          isActive
                            ? 'bg-neon-pink/10 text-neon-pink'
                            : 'text-gray-400 hover:text-white'
                        )}
                      >
                        <span className="material-icons-outlined text-[20px]">
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/5 space-y-1" suppressHydrationWarning={true}>
        <Link
          href="/settings"
          suppressHydrationWarning={true}
          className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-white/5 transition-colors group"
        >
          <div suppressHydrationWarning={true} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors shrink-0">
            <span
              className="text-sm font-bold"
              style={{ color: NEON_PINK }}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1" suppressHydrationWarning={true}>
            <p className="text-xs font-bold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-gray-500 truncate">{role}</p>
          </div>
          <span className="material-icons-outlined text-gray-500 text-[16px] group-hover:text-neon-pink transition-colors shrink-0">
            settings
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <span className="material-icons-outlined text-[16px]">logout</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
