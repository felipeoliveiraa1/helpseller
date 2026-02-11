import { DashboardHeader } from '@/components/layout/dashboard-header'

export default function TeamPage() {
  return (
    <>
      <DashboardHeader title="Equipe" />
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white dark:bg-slate-900 rounded-3xl shadow-sm p-8">
        <h2 className="text-2xl font-bold">Gestão de Equipe</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Funcionalidade em desenvolvimento.
        </p>
      </div>
    </>
  )
}
