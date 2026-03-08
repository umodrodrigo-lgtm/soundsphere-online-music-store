import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Music2, Edit, Trash2, Clock, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { artistsApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Song } from '@/types'
import { formatDuration, formatNumber, imgUrl } from '@/utils/format'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  approved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Approved' },
  pending:  { icon: AlertCircle,  color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending' },
  rejected: { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Rejected' },
}

export default function MySongs() {
  const { playSong } = usePlayerStore()
  const queryClient  = useQueryClient()
  const [page, setPage]     = useState(1)
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['artist-songs', page],
    queryFn: () => artistsApi.mySongs({ page, limit: 20 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => artistsApi.deleteSong(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-songs'] })
      toast.success('Song deleted')
    },
  })

  const songs: Song[] = data?.data || []
  const filtered = filter === 'all' ? songs : songs.filter(s => s.status === filter)

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black font-display text-white">My Songs</h1>
        <div className="flex gap-2">
          {['all', 'approved', 'pending', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-purple-600 text-white' : 'bg-white/8 text-slate-400 hover:bg-white/15'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((song, i) => {
            const cfg = STATUS_CONFIG[song.status] || STATUS_CONFIG.pending
            const StatusIcon = cfg.icon
            return (
              <div key={song.id} className="card p-4 flex items-center gap-4 group">
                <span className="text-slate-600 text-sm w-6 text-center flex-shrink-0">{i + 1}</span>
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer relative"
                  onClick={() => playSong(song, filtered)}
                >
                  <img src={imgUrl(song.cover_image)} alt={song.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white" fill="currentColor" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{song.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {song.genre_name && <span style={{ color: song.genre_color }}>{song.genre_name}</span>}
                    {song.album_title && <span>· {song.album_title}</span>}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs text-slate-500">
                  <span>{formatNumber(song.play_count)} plays</span>
                  <span>{formatNumber(song.like_count)} likes</span>
                  <span><Clock className="w-3 h-3 inline mr-1" />{formatDuration(song.duration)}</span>
                </div>
                <span className={`hidden sm:inline-flex badge ${cfg.bg} ${cfg.color} items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
                {song.is_premium && (
                  <span className="badge bg-yellow-500/10 text-yellow-400 text-[10px]">Premium</span>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { if (confirm('Delete this song?')) deleteMutation.mutate(song.id) }}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <Music2 className="w-20 h-20 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No songs yet</h3>
          <p className="text-slate-500">Upload your first song to get started</p>
        </div>
      )}
      {data?.pagination?.hasNext && (
        <div className="flex justify-center mt-8">
          <button onClick={() => setPage(p => p + 1)} className="btn-secondary">Load More</button>
        </div>
      )}
    </div>
  )
}
