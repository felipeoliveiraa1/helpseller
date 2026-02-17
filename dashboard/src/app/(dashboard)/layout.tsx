import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DashboardContentGuard } from '@/components/dashboard-content-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark flex h-screen overflow-hidden bg-[#121212] text-white" suppressHydrationWarning={true}>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <MobileNav />
      <main className="flex-1 overflow-y-auto scrollbar-hide p-8 min-h-screen pt-14 md:pt-8">
        <DashboardContentGuard>{children}</DashboardContentGuard>
      </main>
    </div>
  )
}
