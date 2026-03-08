import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Music2, TrendingUp, CreditCard, AlertCircle, CheckCircle2, BarChart2, UserCheck } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatNumber, formatCurrency } from '@/utils/format'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data.data),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />

  const { stats, topSongs, genreStats } = data || {}

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black font-display text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { icon: Users,      label: 'Total Users',    value: formatNumber(stats?.totalUsers || 0),          color: 'text-purple-400', bg: 'bg-purple-500/10', to: '/admin/users' },
          { icon: UserCheck,  label: 'Artists',        value: formatNumber(stats?.totalArtists || 0),        color: 'text-blue-400',   bg: 'bg-blue-500/10',   to: '/admin/artists' },
          { icon: Music2,     label: 'Songs',          value: formatNumber(stats?.totalSongs || 0),          color: 'text-pink-400',   bg: 'bg-pink-500/10',   to: '/admin/songs' },
          { icon: AlertCircle,label: 'Pending',        value: stats?.pendingSongs || 0,                      color: 'text-yellow-400', bg: 'bg-yellow-500/10', to: '/admin/songs?status=pending' },
          { icon: CreditCard, label: 'Subscriptions',  value: formatNumber(stats?.activeSubscriptions || 0), color: 'text-green-400',  bg: 'bg-green-500/10',  to: '/admin/subscriptions' },
          { icon: TrendingUp, label: 'Revenue',        value: formatCurrency(stats?.totalRevenue || 0),      color: 'text-yellow-400', bg: 'bg-yellow-500/10', to: '/admin/subscriptions' },
        ].map(({ icon: Icon, label, value, color, bg, to }) => (
          <Link key={label} to={to} className="card p-4 hover:scale-105 transition-transform">
            <div className={`inline-flex ${bg} p-2.5 rounded-xl mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xl font-black text-white leading-none">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top songs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-400" /> Top Songs
            </h2>
            <Link to="/admin/songs" className="text-purple-400 text-sm hover:text-purple-300">View all</Link>
          </div>
          <div className="space-y-3">
            {(topSongs || []).map((song: any, i: number) => (
              <div key={song.id} className="flex items-center gap-3">
                <span className="text-slate-600 text-sm w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{song.title}</p>
                  <p className="text-slate-500 text-xs">{song.artist_name}</p>
                </div>
                <span className="text-purple-400 text-sm font-medium">{formatNumber(song.play_count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Genre distribution */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-pink-400" /> Genre Distribution
          </h2>
          <div className="space-y-3">
            {(genreStats || []).map((g: any) => {
              const max = genreStats?.[0]?.count || 1
              const pct = Math.round((g.count / max) * 100)
              return (
                <div key={g.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{g.name || 'Unknown'}</span>
                    <span className="text-slate-500">{g.count} songs</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/admin/songs?status=pending', icon: AlertCircle, label: 'Review Pending Songs', color: 'text-yellow-400', bg: 'bg-yellow-500/10', count: stats?.pendingSongs },
          { to: '/admin/users',                icon: Users,       label: 'Manage Users',          color: 'text-purple-400', bg: 'bg-purple-500/10', count: stats?.totalUsers },
          { to: '/admin/artists',              icon: UserCheck,   label: 'Approve Artists',       color: 'text-blue-400',   bg: 'bg-blue-500/10',   count: stats?.totalArtists },
          { to: '/admin/plans',                icon: CreditCard,  label: 'Manage Plans',          color: 'text-green-400',  bg: 'bg-green-500/10',  count: null },
        ].map(({ to, icon: Icon, label, color, bg, count }) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:scale-105 transition-transform group">
            <div className={`${bg} p-2.5 rounded-xl flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{label}</p>
              {count !== null && count !== undefined && (
                <p className={`text-xs ${color}`}>{formatNumber(count)} total</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
