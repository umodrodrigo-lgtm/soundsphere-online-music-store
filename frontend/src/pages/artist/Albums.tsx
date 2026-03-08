import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Library, Plus, Music2 } from 'lucide-react'
import { artistsApi, genresApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { imgUrl, formatDate } from '@/utils/format'
import { Genre } from '@/types'
import toast from 'react-hot-toast'

export default function Albums() {
  const queryClient = useQueryClient()
  const coverRef    = useRef<HTMLInputElement>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', genre_id: '', release_date: '', album_type: 'album' })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['artist', 'stats'],
    queryFn: () => artistsApi.stats().then(r => r.data.data),
  })

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.list().then(r => r.data.data as Genre[]),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (coverFile) fd.append('cover', coverFile)
      return artistsApi.createAlbum(fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist'] })
      setShowCreate(false)
      setForm({ title: '', description: '', genre_id: '', release_date: '', album_type: 'album' })
      setCoverFile(null); setCoverPreview('')
      toast.success('Album created!')
    },
    onError: () => toast.error('Failed to create album'),
  })

  const albums = stats?.albums || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black font-display text-white">Albums</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Album
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[#1e1e2e] rounded-2xl p-6 w-full max-w-lg border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create Album</h2>
            <div className="flex gap-4 mb-4">
              <div
                onClick={() => coverRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-colors"
              >
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} />
                {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : <Plus className="w-6 h-6 text-slate-500" />}
              </div>
              <div className="flex-1 space-y-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Album title *" className="input-field" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.album_type} onChange={e => setForm(f => ({ ...f, album_type: e.target.value }))} className="input-field">
                    <option value="album">Album</option>
                    <option value="ep">EP</option>
                    <option value="single">Single</option>
                    <option value="compilation">Compilation</option>
                  </select>
                  <select value={form.genre_id} onChange={e => setForm(f => ({ ...f, genre_id: e.target.value }))} className="input-field">
                    <option value="">Genre</option>
                    {(genres || []).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description" rows={2} className="input-field resize-none mb-3" />
            <input type="date" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))}
              className="input-field mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? 'Creating...' : 'Create Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <LoadingSpinner size="lg" className="py-16" /> : albums.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.map((album: any) => (
            <div key={album.id} className="card p-4 group cursor-pointer">
              <img src={imgUrl(album.cover_image)} alt={album.title}
                className="aspect-square rounded-xl object-cover mb-3 group-hover:scale-105 transition-transform" />
              <h3 className="text-white font-semibold text-sm truncate">{album.title}</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {album.track_count} tracks · {formatDate(album.release_date)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <Library className="w-20 h-20 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No albums yet</h3>
          <p className="text-slate-500 mb-6">Create your first album to organize your music</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Album
          </button>
        </div>
      )}
    </div>
  )
}
