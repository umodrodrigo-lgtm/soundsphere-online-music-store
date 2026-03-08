import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Heart, ListPlus, Share2, Clock, Music2 } from 'lucide-react'
import { songsApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatDuration, formatNumber, formatDate, imgUrl } from '@/utils/format'
import toast from 'react-hot-toast'

export default function SongDetail() {
  const { id } = useParams<{ id: string }>()
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore()
  const queryClient = useQueryClient()

  const { data: song, isLoading } = useQuery({
    queryKey: ['song', id],
    queryFn: () => songsApi.get(id!).then(r => r.data.data),
    enabled: !!id,
  })

  const likeMutation = useMutation({
    mutationFn: () => songsApi.like(id!),
    onSuccess: (res) => {
      queryClient.setQueryData(['song', id], (old: any) => ({
        ...old,
        data: { ...old.data, liked: res.data.liked, like_count: old.data.like_count + (res.data.liked ? 1 : -1) }
      }))
    },
    onError: () => toast.error('Sign in to like songs'),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />
  if (!song)     return <div className="flex items-center justify-center py-32"><p className="text-slate-400">Song not found</p></div>

  const isActive = currentSong?.id === song.id

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-10 mb-12">
        {/* Cover */}
        <div className="flex-shrink-0">
          <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/30 ${isActive && isPlaying ? 'animate-spin-slow' : ''}`}>
            <img src={imgUrl(song.cover_image)} alt={song.title} className="w-full h-full object-cover" />
            {isActive && isPlaying && (
              <div className="absolute inset-0 bg-purple-900/20 flex items-center justify-center">
                <div className="flex items-end gap-1 h-8">
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-end">
          <span className="text-slate-500 text-sm uppercase tracking-wider mb-2">Song</span>
          <h1 className="text-4xl md:text-6xl font-black font-display text-white mb-4 leading-tight">{song.title}</h1>

          <div className="flex items-center gap-3 mb-6">
            <Link to={`/artists/${song.artist_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={imgUrl(song.artist_image)}
                alt={song.artist_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-white font-semibold">{song.artist_name}</span>
            </Link>
            {song.album_title && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{song.album_title}</span>
              </>
            )}
            {song.release_date && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{new Date(song.release_date).getFullYear()}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button
              onClick={() => isActive ? togglePlay() : playSong(song)}
              className="btn-primary flex items-center gap-2 text-lg px-8 py-3.5"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              {isActive && isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => likeMutation.mutate()}
              className={`p-3.5 rounded-full border transition-all ${song.liked ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' : 'border-white/20 text-slate-400 hover:border-white/40 hover:text-white'}`}
            >
              <Heart className="w-6 h-6" fill={song.liked ? 'currentColor' : 'none'} />
            </button>
            <button className="p-3.5 rounded-full border border-white/20 text-slate-400 hover:border-white/40 hover:text-white transition-all">
              <ListPlus className="w-6 h-6" />
            </button>
            <button className="p-3.5 rounded-full border border-white/20 text-slate-400 hover:border-white/40 hover:text-white transition-all">
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4" />
              {formatDuration(song.duration)}
            </div>
            <div className="text-slate-400">
              <span className="text-white font-semibold">{formatNumber(song.play_count)}</span> plays
            </div>
            <div className="text-slate-400">
              <span className="text-white font-semibold">{formatNumber(song.like_count)}</span> likes
            </div>
            {song.genre_name && (
              <span className="badge" style={{ backgroundColor: `${song.genre_color}20`, color: song.genre_color }}>
                {song.genre_name}
              </span>
            )}
            {song.is_premium && (
              <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Premium</span>
            )}
          </div>
        </div>
      </div>

      {/* Lyrics */}
      {song.lyrics && (
        <div className="card p-8 max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-purple-400" />
            Lyrics
          </h2>
          <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {song.lyrics}
          </pre>
        </div>
      )}
    </div>
  )
}
