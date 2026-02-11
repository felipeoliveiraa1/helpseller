import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <MobileNav />
      <main className="flex-1 w-full md:ml-64 p-4 md:p-8 min-h-screen pt-14 md:pt-8">
        {children}
      </main>
    </div>
  )
}
