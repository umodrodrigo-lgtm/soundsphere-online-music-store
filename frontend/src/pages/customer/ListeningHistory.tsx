import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Play } from 'lucide-react'
import { usersApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatDate, formatDuration, imgUrl } from '@/utils/format'
import { Song } from '@/types'

export default function ListeningHistory() {
  const { playSong } = usePlayerStore()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['history', page],
    queryFn: () => usersApi.history({ page, limit: 30 }).then(r => r.data),
  })

  const history = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-7 h-7 text-blue-400" />
        <div>
          <h1 className="text-3xl font-black font-display text-white">Listening History</h1>
          <p className="text-slate-400 text-sm">Songs you've played recently</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : history.length > 0 ? (
        <>
          <div className="space-y-1">
            {history.map((h: any) => (
              <div
                key={h.id}
                className="song-row group"
                onClick={() => playSong({
                  id: h.song_id, title: h.title, slug: h.song_id,
                  artist_name: h.artist_name, artist_id: h.artist_id,
                  cover_image: h.cover_image, duration: h.duration,
                  audio_url: '', play_count: 0, like_count: 0,
                  is_premium: false, status: 'approved', created_at: ''
                } as Song)}
              >
                <img
                  src={imgUrl(h.cover_image)}
                  alt={h.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{h.title}</p>
                  <p className="text-slate-500 text-xs truncate">{h.artist_name}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs text-slate-600">
                  <span>{formatDuration(h.duration)}</span>
                  <span>{formatDate(h.played_at)}</span>
                </div>
                <Play className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="currentColor" />
              </div>
            ))}
          </div>
          {data?.pagination?.hasNext && (
            <div className="flex justify-center mt-8">
              <button onClick={() => setPage(p => p + 1)} className="btn-secondary">Load More</button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <Clock className="w-20 h-20 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No listening history</h3>
          <p className="text-slate-500">Your played songs will appear here</p>
        </div>
      )}
    </div>
  )
}
