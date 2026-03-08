import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Trash2, Search, Play, AlertCircle } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatNumber, formatDuration, imgUrl } from '@/utils/format'
import { Song } from '@/types'
import toast from 'react-hot-toast'

const STATUS_BADGES: Record<string, string> = {
  approved: 'bg-green-500/10 text-green-400',
  pending:  'bg-yellow-500/10 text-yellow-400',
  rejected: 'bg-red-500/10 text-red-400',
}

export default function AdminSongs() {
  const [params]    = useSearchParams()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(params.get('status') || 'all')
  const queryClient = useQueryClient()
  const { playSong } = usePlayerStore()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'songs', page, search, status],
    queryFn: () => adminApi.songs({ page, limit: 20, search, status: status === 'all' ? undefined : status }).then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: 'approved' | 'rejected' }) => adminApi.approveSong(id, s),
    onSuccess: (_, { s }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'songs'] })
      toast.success(`Song ${s}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSong(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'songs'] })
      toast.success('Song deleted')
    },
  })

  const songs: Song[] = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-black font-display text-white">Songs Management</h1>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${status === s ? 'bg-purple-600 text-white' : 'bg-white/8 text-slate-400 hover:bg-white/15'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search songs or artists..." className="input-field pl-10" />
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : (
        <div className="space-y-2">
          {songs.map(song => (
            <div key={song.id} className="card p-4 flex items-center gap-4 group">
              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => playSong(song)}>
                <img src={imgUrl(song.cover_image)} alt={song.title}
                  className="w-12 h-12 rounded-xl object-cover" />
                <Play className="absolute inset-0 m-auto w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{song.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{song.artist_name}</span>
                  {song.genre_name && <><span>·</span><span>{song.genre_name}</span></>}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
                <span>{formatNumber(song.play_count)} plays</span>
                <span>{formatDuration(song.duration)}</span>
              </div>
              <span className={`badge text-xs hidden sm:inline-flex ${STATUS_BADGES[song.status]}`}>
                {song.status}
              </span>
              {song.is_premium && <span className="badge bg-yellow-500/10 text-yellow-400 text-xs hidden sm:inline-flex">Premium</span>}

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {song.status !== 'approved' && (
                  <button
                    onClick={() => approveMutation.mutate({ id: song.id, s: 'approved' })}
                    className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {song.status !== 'rejected' && (
                  <button
                    onClick={() => approveMutation.mutate({ id: song.id, s: 'rejected' })}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { if (confirm('Delete permanently?')) deleteMutation.mutate(song.id) }}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {!songs.length && (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertCircle className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-400">No songs found</p>
            </div>
          )}
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
