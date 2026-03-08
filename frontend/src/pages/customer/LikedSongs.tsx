import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Play } from 'lucide-react'
import { songsApi } from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Song } from '@/types'
import toast from 'react-hot-toast'

export default function LikedSongs() {
  const { playSong } = usePlayerStore()
  const queryClient  = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['liked-songs'],
    queryFn: () => songsApi.liked({ limit: 50 }).then(r => r.data),
  })

  const likeMutation = useMutation({
    mutationFn: (id: string) => songsApi.like(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-songs'] })
      toast.success('Removed from liked songs')
    },
  })

  const songs: Song[] = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center shadow-2xl flex-shrink-0">
          <Heart className="w-20 h-20 text-white" fill="currentColor" />
        </div>
        <div>
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Playlist</p>
          <h1 className="text-4xl font-black font-display text-white mb-2">Liked Songs</h1>
          <p className="text-slate-400">{songs.length} songs</p>
          {songs.length > 0 && (
            <button onClick={() => playSong(songs[0], songs)} className="btn-primary flex items-center gap-2 mt-4">
              <Play className="w-5 h-5" fill="currentColor" /> Play All
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : songs.length > 0 ? (
        <div className="space-y-1">
          {songs.map((song, i) => (
            <SongCard
              key={song.id}
              song={{ ...song, liked: true }}
              queue={songs}
              variant="row"
              index={i + 1}
              onLike={() => likeMutation.mutate(song.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <Heart className="w-20 h-20 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No liked songs yet</h3>
          <p className="text-slate-500">Songs you like will appear here</p>
        </div>
      )}
    </div>
  )
}
