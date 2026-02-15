'use client'

interface RecentCall {
  id: string
  full_name: string
  ended_at: string
  duration_min: number
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'agora'
  if (diffMinutes < 60) return `${diffMinutes}m atrás`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d atrás`
}

export function RecentCalls({ calls }: { calls: RecentCall[] }) {
  if (calls.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Nenhuma chamada recente
      </div>
    )
  }

  return (
    <div className="space-y-5" suppressHydrationWarning={true}>
      {calls.map((call) => (
        <div key={call.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
              {call.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{call.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{call.duration_min} min • {formatRelativeTime(call.ended_at)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
