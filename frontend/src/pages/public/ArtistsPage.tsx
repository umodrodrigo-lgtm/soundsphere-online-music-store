import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { artistsApi } from '@/services/api'
import ArtistCard from '@/components/cards/ArtistCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function ArtistsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['artists', 'list', search, page],
    queryFn: () => artistsApi.list({ search, page, limit: 20 }).then(r => r.data),
  })

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black font-display text-white mb-2">Artists</h1>
        <p className="text-slate-400">Discover talented artists from around the world</p>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search artists..."
          className="input-field pl-12"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {(data?.data || []).map((artist: any) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
          {data?.pagination?.hasNext && (
            <div className="flex justify-center mt-10">
              <button onClick={() => setPage(p => p + 1)} className="btn-secondary">Load More</button>
            </div>
          )}
          {!data?.data?.length && (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="text-slate-400 text-lg">No artists found</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
