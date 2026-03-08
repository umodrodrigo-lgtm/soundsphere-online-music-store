import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play, ListMusic, User } from 'lucide-react'
import { playlistsApi } from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { imgUrl, avatarUrl } from '@/utils/format'

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const { playSong } = usePlayerStore()

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistsApi.get(id!).then(r => r.data.data),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />
  if (!playlist)  return <div className="text-center py-32 text-slate-400">Playlist not found</div>

  const songs = playlist.songs || []

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-2xl">
          {playlist.cover_image ? (
            <img src={imgUrl(playlist.cover_image)} alt={playlist.title} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <ListMusic className="w-20 h-20 text-white" />
          )}
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-slate-500 text-sm uppercase tracking-wider mb-2">Playlist</span>
          <h1 className="text-4xl font-black font-display text-white mb-2">{playlist.title}</h1>
          {playlist.description && <p className="text-slate-400 mb-3">{playlist.description}</p>}
          <div className="flex items-center gap-2 mb-4">
            <img src={avatarUrl(playlist.avatar_url, playlist.display_name)} alt="" className="w-6 h-6 rounded-full" />
            <span className="text-white text-sm">{playlist.display_name || playlist.username}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 text-sm">{songs.length} songs</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => songs.length && playSong(songs[0], songs)} className="btn-primary flex items-center gap-2">
              <Play className="w-5 h-5" fill="currentColor" /> Play
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {songs.map((song: any, i: number) => (
          <SongCard key={song.id} song={song} queue={songs} variant="row" index={i + 1} />
        ))}
        {!songs.length && <p className="text-center text-slate-500 py-16">This playlist is empty</p>}
      </div>
    </div>
  )
}
