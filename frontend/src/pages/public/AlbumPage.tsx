import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import api from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { imgUrl, formatNumber } from '@/utils/format'

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>()
  const { playSong } = usePlayerStore()

  const { data, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => api.get(`/songs?album_id=${id}&limit=50`).then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />

  const songs = data?.data || []

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <img
          src={imgUrl(songs[0]?.album_cover || songs[0]?.cover_image)}
          alt="Album"
          className="w-48 h-48 rounded-2xl object-cover shadow-2xl flex-shrink-0"
        />
        <div className="flex flex-col justify-end">
          <span className="text-slate-500 text-sm uppercase tracking-wider mb-2">Album</span>
          <h1 className="text-4xl font-black font-display text-white mb-2">{songs[0]?.album_title || 'Album'}</h1>
          <Link to={`/artists/${songs[0]?.artist_id}`} className="text-purple-400 hover:text-purple-300 mb-4">
            {songs[0]?.artist_name}
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={() => songs.length && playSong(songs[0], songs)} className="btn-primary flex items-center gap-2">
              <Play className="w-5 h-5" fill="currentColor" /> Play Album
            </button>
            <span className="text-slate-500 text-sm">{songs.length} songs</span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {songs.map((song: any, i: number) => (
          <SongCard key={song.id} song={song} queue={songs} variant="row" index={i + 1} showArtist={false} />
        ))}
      </div>
    </div>
  )
}
