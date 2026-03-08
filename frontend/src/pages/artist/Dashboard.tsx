import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Music2, TrendingUp, Heart, Users, Upload, BarChart2, ChevronRight, BadgeCheck, AlertCircle } from 'lucide-react'
import { artistsApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/store/useAuthStore'
import { formatNumber, imgUrl } from '@/utils/format'

export default function ArtistDashboard() {
  const { user } = useAuthStore()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['artist', 'stats'],
    queryFn: () => artistsApi.stats().then(r => r.data.data),
  })

  const ap = user?.artistProfile

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black font-display text-white">Artist Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400">{ap?.stage_name}</p>
            {ap?.is_verified && <BadgeCheck className="w-4 h-4 text-blue-400" fill="currentColor" />}
            {!ap?.is_approved && (
              <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs">
                <AlertCircle className="w-3 h-3 mr-1 inline" />
                Pending Approval
              </span>
            )}
          </div>
        </div>
        <Link to="/artist/upload" className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Song
        </Link>
      </div>

      {/* Approval warning */}
      {!ap?.is_approved && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-semibold text-sm">Profile Pending Approval</p>
            <p className="text-yellow-400/70 text-xs">An admin needs to approve your profile before your songs go live.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Music2,    label: 'Total Songs',    value: stats?.total_songs    || 0, sub: `${stats?.approved_songs || 0} approved`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: TrendingUp,label: 'Total Plays',    value: formatNumber(stats?.total_plays || 0),    sub: 'All time',  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
          { icon: Heart,     label: 'Total Likes',    value: formatNumber(stats?.total_likes || 0),    sub: 'All songs', color: 'text-pink-400',   bg: 'bg-pink-500/10' },
          { icon: Users,     label: 'Followers',      value: formatNumber(stats?.followers    || 0),   sub: 'Subscribers', color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex ${bg} p-3 rounded-xl mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/artist/upload',  icon: Upload,   label: 'Upload New Song', desc: 'Share your music with the world', color: 'from-purple-600 to-pink-600' },
          { to: '/artist/albums',  icon: Music2,   label: 'Create Album',    desc: 'Organize your songs into albums', color: 'from-blue-600 to-cyan-600' },
          { to: '/artist/profile', icon: BadgeCheck,label: 'Edit Profile',   desc: 'Update your artist profile',     color: 'from-green-600 to-teal-600' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="card p-5 flex items-center gap-4 hover:scale-105 transition-transform group">
            <div className={`bg-gradient-to-br ${color} p-3 rounded-xl flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{label}</p>
              <p className="text-slate-500 text-xs">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-purple-400 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Top songs */}
      {stats?.topSongs?.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-400" /> Top Songs
            </h2>
            <Link to="/artist/songs" className="text-purple-400 text-sm hover:text-purple-300">View all</Link>
          </div>
          <div className="space-y-3">
            {stats.topSongs.map((song: any, i: number) => (
              <div key={song.id} className="flex items-center gap-4">
                <span className="text-slate-600 text-sm w-5 text-right">{i + 1}</span>
                <img src={imgUrl(song.cover_image)} alt={song.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{song.title}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>{formatNumber(song.play_count)} plays</span>
                    <span>{formatNumber(song.like_count)} likes</span>
                  </div>
                </div>
                <div className="hidden sm:block w-32 bg-white/5 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (song.play_count / (stats.topSongs[0]?.play_count || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Albums */}
      {stats?.albums?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Albums</h2>
            <Link to="/artist/albums" className="text-purple-400 text-sm hover:text-purple-300">Manage</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.albums.map((album: any) => (
              <div key={album.id} className="group cursor-pointer">
                <img src={imgUrl(album.cover_image)} alt={album.title}
                  className="aspect-square rounded-xl object-cover mb-2 group-hover:scale-105 transition-transform" />
                <p className="text-white text-sm font-medium truncate">{album.title}</p>
                <p className="text-slate-500 text-xs">{album.track_count} tracks</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
