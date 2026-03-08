import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Heart, Users, Music2, BarChart2 } from 'lucide-react'
import { artistsApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatNumber, imgUrl } from '@/utils/format'

export default function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['artist', 'stats'],
    queryFn: () => artistsApi.stats().then(r => r.data.data),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <BarChart2 className="w-7 h-7 text-purple-400" />
        <h1 className="text-3xl font-black font-display text-white">Analytics</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Music2,    label: 'Songs',       value: stats?.total_songs    || 0,                      color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: TrendingUp,label: 'Total Plays', value: formatNumber(stats?.total_plays || 0),           color: 'text-blue-400',   bg: 'bg-blue-500/10' },
          { icon: Heart,     label: 'Total Likes', value: formatNumber(stats?.total_likes || 0),           color: 'text-pink-400',   bg: 'bg-pink-500/10' },
          { icon: Users,     label: 'Followers',   value: formatNumber(stats?.followers    || 0),          color: 'text-green-400',  bg: 'bg-green-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-6">
            <div className={`inline-flex ${bg} p-3 rounded-xl mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-black text-white">{value}</p>
            <p className="text-slate-400 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Song performance */}
      {stats?.topSongs?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-6">Song Performance</h2>
          <div className="space-y-4">
            {stats.topSongs.map((song: any, i: number) => {
              const maxPlays = stats.topSongs[0]?.play_count || 1
              const pct = Math.round((song.play_count / maxPlays) * 100)
              return (
                <div key={song.id} className="flex items-center gap-4">
                  <span className="text-slate-600 text-sm w-4">{i + 1}</span>
                  <img src={imgUrl(song.cover_image)} alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm font-medium truncate">{song.title}</span>
                      <span className="text-slate-400 text-xs ml-4 flex-shrink-0">{formatNumber(song.play_count)} plays</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs hidden sm:block w-20 text-right">
                    ❤️ {formatNumber(song.like_count)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Song status breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Approved',     value: stats?.approved_songs || 0, color: 'bg-green-500',  text: 'text-green-400' },
          { label: 'Pending Review', value: stats?.pending_songs  || 0, color: 'bg-yellow-500', text: 'text-yellow-400' },
          { label: 'Total Songs',  value: stats?.total_songs    || 0, color: 'bg-purple-500', text: 'text-purple-400' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className="card p-6 flex items-center gap-4">
            <div className={`w-3 h-10 ${color} rounded-full flex-shrink-0`} />
            <div>
              <p className={`text-2xl font-black ${text}`}>{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
