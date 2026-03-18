import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DashboardContentGuard } from '@/components/dashboard-content-guard'
import { ProductTour } from '@/components/product-tour'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark flex h-screen overflow-hidden bg-[#121212] text-white" suppressHydrationWarning={true}>
      {/* Neon ambient glows */}
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(255,0,122,0.06) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-60 w-[600px] h-[400px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,209,255,0.04) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div className="hidden md:flex relative z-10" suppressHydrationWarning={true}>
        <Sidebar />
      </div>
      <MobileNav />
      <main className="flex-1 overflow-y-auto scrollbar-hide p-8 min-h-screen pt-14 md:pt-8 relative z-10">
        <DashboardContentGuard>{children}</DashboardContentGuard>
      </main>
      <ProductTour />
    </div>
  )
}
