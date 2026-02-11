const MOCK_CALLS = [
  { name: 'João Silva', email: 'joao@example.com', score: '85', date: '2 min atrás' },
  { name: 'Maria Souza', email: 'maria@example.com', score: '92', date: '15 min atrás' },
  { name: 'Pedro Santos', email: 'pedro@example.com', score: '64', date: '1 hr atrás' },
  { name: 'Ana Oliveira', email: 'ana@example.com', score: '78', date: '2 hrs atrás' },
  { name: 'Carlos Lima', email: 'carlos@example.com', score: '99', date: '3 hrs atrás' },
]

export function RecentCalls() {
  return (
    <div className="space-y-6">
      {MOCK_CALLS.map((call, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-primary rounded-xl flex items-center justify-center font-bold flex-shrink-0">
              {call.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{call.name}</p>
              <p className="text-xs text-slate-500 truncate">{call.email}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-green-500 flex-shrink-0">
            {call.score}
          </span>
        </div>
      ))}
    </div>
  )
}
