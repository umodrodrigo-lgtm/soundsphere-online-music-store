import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, BadgeCheck, CheckCircle2, XCircle } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { imgUrl, formatNumber } from '@/utils/format'
import toast from 'react-hot-toast'

export default function AdminArtists() {
  const queryClient = useQueryClient()
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [approved, setApproved] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'artists', page, search, approved],
    queryFn: () => adminApi.artists({ page, limit: 20, search, approved: approved === '' ? undefined : approved }).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      adminApi.updateArtist(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'artists'] })
      toast.success('Artist updated')
    },
  })

  const artists = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-black font-display text-white">Artists</h1>
        <div className="flex gap-2">
          {[['', 'All'], ['true', 'Approved'], ['false', 'Pending']].map(([val, label]) => (
            <button key={val} onClick={() => { setApproved(val); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${approved === val ? 'bg-purple-600 text-white' : 'bg-white/8 text-slate-400 hover:bg-white/15'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search artists..." className="input-field pl-10" />
      </div>

      {isLoading ? <LoadingSpinner size="lg" className="py-16" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist: any) => (
            <div key={artist.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={imgUrl(artist.profile_image, `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.stage_name)}&background=7c3aed&color=fff&size=100`)}
                  alt={artist.stage_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-white font-medium text-sm truncate">{artist.stage_name}</p>
                    {artist.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  </div>
                  <p className="text-slate-500 text-xs truncate">{artist.email}</p>
                </div>
              </div>

              <div className="flex gap-4 text-xs text-slate-500 mb-3">
                <span>{artist.song_count} songs</span>
                <span>{formatNumber(artist.monthly_listeners)} listeners</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge text-xs ${artist.is_approved ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {artist.is_approved ? 'Approved' : 'Pending'}
                </span>
                <div className="ml-auto flex gap-1">
                  {!artist.is_approved ? (
                    <button
                      onClick={() => updateMutation.mutate({ id: artist.id, updates: { is_approved: true } })}
                      className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateMutation.mutate({ id: artist.id, updates: { is_approved: false } })}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Revoke"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => updateMutation.mutate({ id: artist.id, updates: { is_verified: !artist.is_verified } })}
                    className={`p-1.5 rounded-lg transition-colors ${artist.is_verified ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/10'}`}
                    title={artist.is_verified ? 'Remove verification' : 'Verify artist'}
                  >
                    <BadgeCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
