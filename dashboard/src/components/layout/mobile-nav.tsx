'use client'

import Link from 'next/link'

export function MobileNav() {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2 text-xl font-bold tracking-tight"
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">C</span>
        </div>
        CloseIA
      </Link>
      <Link
        href="/"
        className="text-sm font-medium text-primary"
      >
        Dashboard
      </Link>
    </div>
  )
}
