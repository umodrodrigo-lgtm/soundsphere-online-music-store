import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, BadgeCheck, Globe, Instagram, Twitter, Youtube, UserPlus, UserCheck, Music2 } from 'lucide-react'
import { artistsApi } from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatNumber, imgUrl } from '@/utils/format'
import toast from 'react-hot-toast'

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>()
  const { playSong } = usePlayerStore()
  const queryClient = useQueryClient()

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsApi.get(id!).then(r => r.data.data),
    enabled: !!id,
  })

  const followMutation = useMutation({
    mutationFn: () => artistsApi.follow(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist', id] })
    },
    onError: () => toast.error('Sign in to follow artists'),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />
  if (!artist) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-slate-400">Artist not found</p>
    </div>
  )

  const playAll = () => {
    if (artist.songs?.length) playSong(artist.songs[0], artist.songs)
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-80 md:h-96">
        <img
          src={imgUrl(artist.cover_image, 'https://images.unsplash.com/photo-1501386761578-eaa54b292f16?w=1400&h=400&fit=crop')}
          alt={artist.stage_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0a0a0f]" />
      </div>

      <div className="max-w-screen-xl mx-auto px-6">
        {/* Profile row */}
        <div className="relative -mt-24 flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <img
            src={imgUrl(artist.profile_image, `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.stage_name)}&background=7c3aed&color=fff&size=300`)}
            alt={artist.stage_name}
            className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover ring-4 ring-[#0a0a0f] shadow-2xl flex-shrink-0"
          />
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-5xl font-black font-display text-white">{artist.stage_name}</h1>
              {artist.is_verified && <BadgeCheck className="w-7 h-7 text-blue-400" fill="currentColor" />}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm mb-4">
              <span>{formatNumber(artist.monthly_listeners)} monthly listeners</span>
              <span>·</span>
              <span>{formatNumber(artist.follower_count || 0)} followers</span>
              {artist.genre_name && (
                <>
                  <span>·</span>
                  <span style={{ color: artist.genre_color }}>{artist.genre_name}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={playAll} className="btn-primary flex items-center gap-2">
                <Play className="w-5 h-5" fill="currentColor" />
                Play All
              </button>
              <button
                onClick={() => followMutation.mutate()}
                className={`btn-secondary flex items-center gap-2 ${artist.following ? 'border-purple-500 text-purple-400' : ''}`}
              >
                {artist.following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {artist.following ? 'Following' : 'Follow'}
              </button>
              {/* Social links */}
              {artist.instagram && <a href={artist.instagram} target="_blank" rel="noreferrer" className="btn-ghost p-2.5"><Instagram className="w-4 h-4" /></a>}
              {artist.twitter   && <a href={artist.twitter}   target="_blank" rel="noreferrer" className="btn-ghost p-2.5"><Twitter className="w-4 h-4" /></a>}
              {artist.youtube   && <a href={artist.youtube}   target="_blank" rel="noreferrer" className="btn-ghost p-2.5"><Youtube className="w-4 h-4" /></a>}
              {artist.website   && <a href={artist.website}   target="_blank" rel="noreferrer" className="btn-ghost p-2.5"><Globe className="w-4 h-4" /></a>}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 pb-16">
          {/* Songs */}
          <div className="lg:col-span-2">
            <h2 className="section-title mb-6 flex items-center gap-2">
              <Music2 className="w-6 h-6 text-purple-400" />
              Popular Songs
            </h2>
            <div className="space-y-1">
              {artist.songs?.map((song: any, i: number) => (
                <SongCard key={song.id} song={song} queue={artist.songs} variant="row" index={i + 1} showArtist={false} />
              ))}
              {!artist.songs?.length && (
                <p className="text-slate-500 py-8 text-center">No songs yet</p>
              )}
            </div>

            {/* Albums */}
            {artist.albums?.length > 0 && (
              <div className="mt-10">
                <h2 className="section-title mb-6">Discography</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {artist.albums.map((album: any) => (
                    <div key={album.id} className="card p-4 cursor-pointer group">
                      <img
                        src={imgUrl(album.cover_image)}
                        alt={album.title}
                        className="aspect-square rounded-xl object-cover mb-3 group-hover:scale-105 transition-transform"
                      />
                      <p className="font-semibold text-white text-sm truncate">{album.title}</p>
                      <p className="text-slate-500 text-xs capitalize">{album.album_type} · {album.track_count || 0} tracks</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="card p-6 mb-6">
              <h3 className="font-bold text-white mb-4">About</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{artist.bio || 'No bio available.'}</p>
            </div>
            <div className="card p-6">
              <h3 className="font-bold text-white mb-4">Stats</h3>
              {[
                ['Monthly Listeners', formatNumber(artist.monthly_listeners)],
                ['Total Plays',       formatNumber(artist.total_plays)],
                ['Followers',         formatNumber(artist.follower_count || 0)],
                ['Country',           artist.country || '—'],
                ['Member Since',      new Date(artist.member_since).getFullYear()],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-500 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
