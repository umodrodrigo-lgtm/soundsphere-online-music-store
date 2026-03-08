import React from 'react'
import { Play, Heart, MoreHorizontal, Clock } from 'lucide-react'
import { Song } from '@/types'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatDuration, formatNumber, imgUrl } from '@/utils/format'

interface SongCardProps {
  song: Song
  queue?: Song[]
  onLike?: (id: string) => void
  showArtist?: boolean
  variant?: 'card' | 'row'
  index?: number
}

export default function SongCard({ song, queue, onLike, showArtist = true, variant = 'card', index }: SongCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore()
  const isActive = currentSong?.id === song.id

  if (variant === 'row') {
    return (
      <div
        className={`song-row ${isActive ? 'bg-purple-600/10 border border-purple-600/20' : ''}`}
        onClick={() => playSong(song, queue)}
      >
        <div className="w-8 text-center flex-shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-4">
              <div className="equalizer-bar" />
              <div className="equalizer-bar" />
              <div className="equalizer-bar" />
            </div>
          ) : (
            <span className="text-slate-500 text-sm group-hover:hidden">{index ?? ''}</span>
          )}
          <Play className="w-4 h-4 text-white hidden group-hover:block" fill="currentColor" />
        </div>
        <img
          src={imgUrl(song.cover_image)}
          alt={song.title}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate text-sm ${isActive ? 'text-purple-400' : 'text-white'}`}>{song.title}</p>
          {showArtist && <p className="text-slate-500 text-xs truncate">{song.artist_name}</p>}
        </div>
        {song.is_premium && (
          <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] px-1.5">
            Premium
          </span>
        )}
        <span className="text-slate-500 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(song.duration)}
        </span>
        {onLike && (
          <button
            onClick={(e) => { e.stopPropagation(); onLike(song.id) }}
            className={`p-1.5 rounded-full transition-colors ${song.liked ? 'text-pink-500' : 'text-slate-600 hover:text-pink-400'}`}
          >
            <Heart className="w-4 h-4" fill={song.liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`card p-4 cursor-pointer group relative overflow-hidden ${isActive ? 'border-purple-600/30' : ''}`}
      onClick={() => playSong(song, queue)}
    >
      {/* Cover */}
      <div className="relative mb-3 aspect-square rounded-xl overflow-hidden">
        <img
          src={imgUrl(song.cover_image)}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/50 scale-90 group-hover:scale-100 transition-transform">
            {isActive && isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <div className="equalizer-bar" />
                <div className="equalizer-bar" />
                <div className="equalizer-bar" />
              </div>
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
            )}
          </div>
        </div>
        {song.is_premium && (
          <div className="absolute top-2 right-2">
            <span className="badge bg-yellow-500/90 text-yellow-900 text-[10px] font-bold">PREMIUM</span>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className={`font-semibold text-sm truncate mb-0.5 ${isActive ? 'text-purple-400' : 'text-white'}`}>
        {song.title}
      </h3>
      {showArtist && (
        <p className="text-slate-500 text-xs truncate mb-2">{song.artist_name}</p>
      )}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{formatNumber(song.play_count)} plays</span>
        <span>{formatDuration(song.duration)}</span>
      </div>

      {/* Like btn */}
      {onLike && (
        <button
          onClick={(e) => { e.stopPropagation(); onLike(song.id) }}
          className={`absolute top-3 right-3 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all ${song.liked ? 'text-pink-500 opacity-100' : 'text-white'}`}
        >
          <Heart className="w-4 h-4" fill={song.liked ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  )
}
