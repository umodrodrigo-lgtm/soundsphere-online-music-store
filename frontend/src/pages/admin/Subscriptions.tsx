import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatDate, formatCurrency } from '@/utils/format'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400',
  expired:   'bg-slate-500/10 text-slate-400',
  cancelled: 'bg-red-500/10 text-red-400',
  pending:   'bg-yellow-500/10 text-yellow-400',
}

export default function AdminSubscriptions() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', page],
    queryFn: () => adminApi.subscriptions({ page, limit: 20 }).then(r => r.data),
  })

  const subs = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-7 h-7 text-green-400" />
        <h1 className="text-3xl font-black font-display text-white">Subscriptions</h1>
      </div>

      {isLoading ? <LoadingSpinner size="lg" className="py-16" /> : (
        <div className="space-y-2">
          {subs.map((sub: any) => (
            <div key={sub.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{sub.username || sub.email}</p>
                <p className="text-slate-500 text-xs">{sub.email}</p>
              </div>
              <div className="hidden sm:block text-center">
                <p className="text-white text-sm font-medium">{sub.plan_name}</p>
                <p className="text-slate-500 text-xs">{formatCurrency(sub.price)}/mo</p>
              </div>
              <div className="hidden md:block text-center">
                <p className="text-slate-400 text-xs">Started</p>
                <p className="text-white text-sm">{formatDate(sub.started_at)}</p>
              </div>
              <div className="hidden md:block text-center">
                <p className="text-slate-400 text-xs">Expires</p>
                <p className="text-white text-sm">{sub.expires_at ? formatDate(sub.expires_at) : '—'}</p>
              </div>
              <span className={`badge text-xs ${STATUS_COLORS[sub.status] || ''}`}>{sub.status}</span>
            </div>
          ))}
          {!subs.length && <p className="text-center text-slate-500 py-16">No subscriptions found</p>}
        </div>
      )}

      {data?.pagination?.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-2 px-4">Prev</button>
          <span className="flex items-center px-4 text-slate-400 text-sm">Page {page} of {data.pagination.pages}</span>
          <button disabled={!data?.pagination?.hasNext} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-2 px-4">Next</button>
        </div>
      )}
    </div>
  )
}
