import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { songsApi, genresApi } from '@/services/api'
import SongCard from '@/components/cards/SongCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Song, Genre } from '@/types'

const SORT_OPTIONS = [
  { value: 'latest',   label: 'Latest' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular',  label: 'Most Played' },
]

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [genre, setGenre]   = useState(params.get('genre') || '')
  const [sort, setSort]     = useState(params.get('sort') || 'latest')
  const [page, setPage]     = useState(1)

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.list().then(r => r.data.data as Genre[]),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['songs', 'browse', search, genre, sort, page],
    queryFn: () => {
      if (sort === 'trending') return songsApi.trending(20).then(r => ({ data: r.data.data, pagination: null }))
      if (sort === 'latest')   return songsApi.latest(20).then(r => ({ data: r.data.data, pagination: null }))
      return songsApi.list({ search, genre, page, limit: 20 }).then(r => r.data)
    },
  })

  const songs = Array.isArray(data?.data) ? data.data as Song[] : []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setParams({ q: search, genre, sort })
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black font-display text-white mb-2">Browse Music</h1>
        <p className="text-slate-400">Explore millions of songs across every genre</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="input-field pl-12"
          />
        </form>
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1) }}
          className="input-field sm:w-40"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { setGenre(''); setPage(1) }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!genre ? 'bg-purple-600 text-white' : 'bg-white/8 text-slate-400 hover:bg-white/15'}`}
        >
          All
        </button>
        {(genres || []).map(g => (
          <button
            key={g.id}
            onClick={() => { setGenre(genre === g.slug ? '' : g.slug); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${genre === g.slug ? 'text-white' : 'bg-white/8 text-slate-400 hover:bg-white/15'}`}
            style={genre === g.slug ? { backgroundColor: g.color } : {}}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : songs.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {songs.map(song => (
              <SongCard key={song.id} song={song} queue={songs} />
            ))}
          </div>
          {data?.pagination && data.pagination.hasNext && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary"
              >
                Load More
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No songs found</h3>
          <p className="text-slate-500">Try a different search or genre filter</p>
        </div>
      )}
    </div>
  )
}
