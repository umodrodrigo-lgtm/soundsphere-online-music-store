import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, BadgeCheck } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { avatarUrl, formatDate } from '@/utils/format'
import toast from 'react-hot-toast'

const ROLE_COLORS: Record<string, string> = {
  admin:    'bg-red-500/10 text-red-400',
  artist:   'bg-purple-500/10 text-purple-400',
  customer: 'bg-blue-500/10 text-blue-400',
}

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole]     = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, role],
    queryFn: () => adminApi.users({ page, limit: 20, search, role: role || undefined }).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      adminApi.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User updated')
    },
  })

  const users = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-black font-display text-white">Users</h1>
        <div className="flex gap-2">
          {['', 'admin', 'artist', 'customer'].map(r => (
            <button key={r} onClick={() => { setRole(r); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${role === r ? 'bg-purple-600 text-white' : 'bg-white/8 text-slate-400 hover:bg-white/15'}`}>
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search users..." className="input-field pl-10" />
      </div>

      {isLoading ? <LoadingSpinner size="lg" className="py-16" /> : (
        <>
          <div className="space-y-2">
            {users.map((user: any) => (
              <div key={user.id} className="card p-4 flex items-center gap-4">
                <img
                  src={avatarUrl(user.avatar_url, user.display_name)}
                  alt={user.display_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{user.display_name}</p>
                    {user.email_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-slate-500 text-xs truncate">{user.email} · @{user.username}</p>
                </div>
                <span className={`badge text-xs hidden sm:inline-flex ${ROLE_COLORS[user.role] || ''}`}>{user.role}</span>
                <span className="text-slate-600 text-xs hidden md:block">{formatDate(user.created_at)}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => updateMutation.mutate({ id: user.id, updates: { is_active: !user.is_active } })}
                    className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                    title={user.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {user.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data?.pagination?.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-2 px-4">Prev</button>
              <span className="flex items-center px-4 text-slate-400 text-sm">Page {page} of {data.pagination.pages}</span>
              <button disabled={!data?.pagination?.hasNext} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-2 px-4">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
