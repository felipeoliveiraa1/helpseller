'use client'

import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

export function DashboardHeader({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  const { theme, toggleTheme } = useTheme()

  const iconButtonClass =
    'p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all'

  return (
    <header
      className={cn(
        'flex items-center justify-between mb-8',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="relative w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar"
            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          onClick={toggleTheme}
          className={iconButtonClass}
        >
          <span className="material-icons-outlined block dark:hidden">
            dark_mode
          </span>
          <span className="material-icons-outlined hidden dark:block">
            light_mode
          </span>
        </button>
        <button type="button" aria-label="Mensagens" className={iconButtonClass}>
          <span className="material-icons-outlined">mail</span>
        </button>
        <button
          type="button"
          aria-label="Notificações"
          className={`${iconButtonClass} relative`}
        >
          <span className="material-icons-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
        </button>
        <button type="button" aria-label="Menu" className={iconButtonClass}>
          <span className="material-icons-outlined">grid_view</span>
        </button>
      </div>
    </header>
  )
}
