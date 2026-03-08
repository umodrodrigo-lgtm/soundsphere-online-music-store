import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Library } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AdminGenres() {
  const { data: genres, isLoading } = useQuery({
    queryKey: ['admin', 'genres'],
    queryFn: () => adminApi.genres().then(r => r.data.data),
  })

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Library className="w-7 h-7 text-pink-400" />
        <h1 className="text-3xl font-black font-display text-white">Genres</h1>
      </div>

      {isLoading ? <LoadingSpinner size="lg" className="py-16" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(genres || []).map((genre: any) => (
            <div key={genre.id} className="card p-4 text-center">
              <div className="text-3xl mb-2">{genre.icon}</div>
              <p className="text-white font-semibold text-sm">{genre.name}</p>
              <div className="h-1 rounded-full mt-2 mb-1" style={{ backgroundColor: genre.color }} />
              <p className="text-slate-500 text-xs">{genre.song_count} songs</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
