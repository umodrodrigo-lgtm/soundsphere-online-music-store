import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play, TrendingUp, Clock, Heart, ListMusic, Crown, ChevronRight } from 'lucide-react'
import { songsApi, usersApi } from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/store/useAuthStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import { avatarUrl, formatDate } from '@/utils/format'
import { Song } from '@/types'

export default function CustomerDashboard() {
  const { user } = useAuthStore()
  const { playSong } = usePlayerStore()

  const { data: trending } = useQuery({
    queryKey: ['songs', 'trending'],
    queryFn: () => songsApi.trending(6).then(r => r.data.data as Song[]),
  })
  const { data: latest } = useQuery({
    queryKey: ['songs', 'latest'],
    queryFn: () => songsApi.latest(6).then(r => r.data.data as Song[]),
  })
  const { data: history } = useQuery({
    queryKey: ['user', 'history'],
    queryFn: () => usersApi.history({ limit: 5 }).then(r => r.data),
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const isPremium = user?.subscription?.is_premium

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-slate-400 text-sm">{greeting}</p>
          <h1 className="text-3xl font-black font-display text-white">
            {user?.display_name?.split(' ')[0]} 👋
          </h1>
        </div>
        {!isPremium && (
          <Link to="/subscription" className="btn-primary flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </Link>
        )}
      </div>

      {/* Subscription card */}
      {isPremium ? (
        <div className="relative rounded-2xl overflow-hidden p-6 mb-8 bg-gradient-to-r from-purple-900/60 to-pink-900/40 border border-purple-500/20">
          <Crown className="absolute right-6 top-6 w-16 h-16 text-yellow-400/20" />
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">Premium Member</span>
          </div>
          <p className="text-white font-semibold text-lg">{user?.subscription?.plan_name}</p>
          <p className="text-slate-400 text-sm">
            {user?.subscription?.expires_at
              ? `Renews ${formatDate(user.subscription.expires_at)}`
              : 'Active subscription'}
          </p>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden p-6 mb-8 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold mb-1">Free Plan</p>
              <p className="text-slate-400 text-sm">Upgrade for unlimited access & no ads</p>
            </div>
            <Link to="/subscription" className="btn-primary text-sm py-2 flex items-center gap-1">
              Upgrade <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { to: '/liked',    icon: Heart,      label: 'Liked Songs',  color: 'text-pink-400',   bg: 'bg-pink-500/10' },
          { to: '/history',  icon: Clock,      label: 'History',      color: 'text-blue-400',   bg: 'bg-blue-500/10' },
          { to: '/playlists',icon: ListMusic,  label: 'Playlists',    color: 'text-green-400',  bg: 'bg-green-500/10' },
          { to: '/browse',   icon: TrendingUp, label: 'Explore',      color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ to, icon: Icon, label, color, bg }) => (
          <Link key={to} to={to} className="card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform">
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <span className="text-white text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent history */}
      {history?.data?.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recently Played
            </h2>
            <Link to="/history" className="text-purple-400 text-sm hover:text-purple-300">View all</Link>
          </div>
          <div className="space-y-1">
            {history.data.slice(0, 5).map((h: any) => (
              <div key={h.id} className="song-row" onClick={() => playSong({
                id: h.song_id, title: h.title, artist_name: h.artist_name,
                artist_id: h.artist_id, cover_image: null, duration: h.duration,
                audio_url: '', play_count: 0, like_count: 0, is_premium: false,
                status: 'approved', slug: '', created_at: ''
              } as Song)}>
                <img src={h.cover_image || 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=100&h=100&fit=crop'} alt={h.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{h.title}</p>
                  <p className="text-slate-500 text-xs truncate">{h.artist_name}</p>
                </div>
                <span className="text-slate-600 text-xs">{formatDate(h.played_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending?.length ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              Trending
            </h2>
            <Link to="/browse?sort=trending" className="text-purple-400 text-sm hover:text-purple-300">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {trending.map(song => <SongCard key={song.id} song={song} queue={trending} />)}
          </div>
        </div>
      ) : null}

      {/* Latest */}
      {latest?.length ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">New Releases</h2>
            <Link to="/browse?sort=latest" className="text-purple-400 text-sm hover:text-purple-300">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {latest.map(song => <SongCard key={song.id} song={song} queue={latest} />)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
