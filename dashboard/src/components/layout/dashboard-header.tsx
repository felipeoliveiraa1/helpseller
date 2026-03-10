'use client'

import { cn } from '@/lib/utils'

export function DashboardHeader({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return (
    <header
      className={cn('flex items-center justify-between mb-8', className)}
    >
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <div className="relative w-80">
        <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full bg-card-dark border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-300 placeholder:text-gray-500 focus:ring-1 focus:ring-neon-pink focus:outline-none"
        />
      </div>
    </header>
  )
}
