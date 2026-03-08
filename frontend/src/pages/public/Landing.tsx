import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play, ChevronRight, Headphones, Music2, Shield, Zap, Users, TrendingUp } from 'lucide-react'
import { songsApi, artistsApi, genresApi } from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import ArtistCard from '@/components/cards/ArtistCard'
import { Song, ArtistProfile, Genre } from '@/types'
import { imgUrl } from '@/utils/format'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=900&fit=crop&q=80'

export default function Landing() {
  const { data: trending } = useQuery({
    queryKey: ['songs', 'trending'],
    queryFn: () => songsApi.trending(8).then(r => r.data.data as Song[]),
  })
  const { data: latest } = useQuery({
    queryKey: ['songs', 'latest'],
    queryFn: () => songsApi.latest(8).then(r => r.data.data as Song[]),
  })
  const { data: artists } = useQuery({
    queryKey: ['artists', 'featured'],
    queryFn: () => artistsApi.list({ limit: 8 }).then(r => r.data.data as ArtistProfile[]),
  })
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.list().then(r => r.data.data as Genre[]),
  })

  return (
    <div className="overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Hero" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-6 py-24">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">The Future of Music Streaming</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black font-display text-white leading-tight mb-6">
              Your Music,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">
              Stream millions of songs from world-class artists. Discover new music, create playlists, and lose yourself in the sound.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/browse" className="btn-primary flex items-center gap-2 text-lg py-4 px-8">
                <Play className="w-5 h-5" fill="currentColor" />
                Start Listening
              </Link>
              <Link to="/subscription" className="btn-secondary flex items-center gap-2 text-lg py-4 px-8">
                Get Premium
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-12">
              {[['50M+', 'Songs'], ['2M+', 'Artists'], ['100M+', 'Listeners']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-3xl font-black text-white font-display">{num}</p>
                  <p className="text-slate-500 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating cards */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 animate-fade-in">
          {(trending || []).slice(0, 3).map(song => (
            <div key={song.id} className="glass rounded-2xl p-3 flex items-center gap-3 w-64 hover:bg-white/10 transition-colors cursor-pointer">
              <img src={imgUrl(song.cover_image)} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
                <p className="text-slate-400 text-xs truncate">{song.artist_name}</p>
              </div>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Play className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Genres ────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Browse by Genre</h2>
          <Link to="/browse" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(genres || []).slice(0, 10).map(genre => (
            <Link
              key={genre.id}
              to={`/browse?genre=${genre.slug}`}
              className="relative rounded-2xl overflow-hidden aspect-[3/2] group cursor-pointer"
              style={{ backgroundColor: `${genre.color}20` }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <span className="text-3xl mb-1">{genre.icon}</span>
                <span className="font-semibold text-white text-sm text-center">{genre.name}</span>
                <span className="text-xs text-white/60">{genre.song_count} songs</span>
              </div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: genre.color }}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────── */}
      {trending?.length ? (
        <section className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-pink-400" />
              <h2 className="section-title">Trending Now</h2>
            </div>
            <Link to="/browse?sort=trending" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {trending.slice(0, 8).map(song => (
              <SongCard key={song.id} song={song} queue={trending} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Featured Artists ─────────────────────────────────────── */}
      {artists?.length ? (
        <section className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="section-title">Featured Artists</h2>
            </div>
            <Link to="/artists" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
              All artists <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {artists.slice(0, 8).map(artist => (
              <ArtistCard key={artist.id} artist={artist as any} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── New Releases ─────────────────────────────────────────── */}
      {latest?.length ? (
        <section className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Music2 className="w-6 h-6 text-blue-400" />
              <h2 className="section-title">New Releases</h2>
            </div>
            <Link to="/browse?sort=latest" className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {latest.slice(0, 8).map(song => (
              <SongCard key={song.id} song={song} queue={latest} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="relative py-24 mt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />
        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black font-display text-white mb-4">
              Why Choose <span className="gradient-text">SoundSphere</span>?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Experience music the way it was meant to be heard.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Headphones, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Hi-Fi Audio', desc: 'Crystal clear lossless audio quality on premium.' },
              { icon: Music2,     color: 'text-pink-400',   bg: 'bg-pink-500/10',   title: '50M+ Songs', desc: 'The largest catalog of music from every genre.' },
              { icon: Shield,     color: 'text-blue-400',   bg: 'bg-blue-500/10',   title: 'Ad-Free',    desc: 'No interruptions. Just pure music on premium.' },
              { icon: Users,      color: 'text-green-400',  bg: 'bg-green-500/10',  title: 'Family Plan', desc: 'Share with up to 6 family members.' },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className={`inline-flex ${bg} p-4 rounded-2xl mb-4`}>
                  <Icon className={`w-8 h-8 ${color}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="relative mx-6 mb-16 rounded-3xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&h=500&fit=crop"
          alt="CTA"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-pink-900/70 flex items-center">
          <div className="px-8 md:px-16">
            <h2 className="text-3xl md:text-5xl font-black font-display text-white mb-4">
              Start Your Free Trial
            </h2>
            <p className="text-white/80 mb-6 max-w-md">Try Premium free for 30 days. No credit card required.</p>
            <Link to="/subscription" className="btn-primary inline-flex items-center gap-2">
              Get Premium Now
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="font-bold text-white font-display">SoundSphere</span>
            </div>
            <p className="text-slate-500 text-sm">The next generation music streaming platform.</p>
          </div>
          {[
            ['Company', ['About', 'Blog', 'Careers', 'Press']],
            ['Product', ['Features', 'Pricing', 'Artists', 'API']],
            ['Legal',   ['Privacy', 'Terms', 'Cookies']],
          ].map(([title, links]) => (
            <div key={title as string}>
              <h4 className="text-white font-semibold mb-4 text-sm">{title as string}</h4>
              <ul className="space-y-2">
                {(links as string[]).map(l => (
                  <li key={l}><a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-screen-xl mx-auto px-6 mt-8 pt-8 border-t border-white/5 text-center text-slate-600 text-sm">
          © {new Date().getFullYear()} SoundSphere. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
