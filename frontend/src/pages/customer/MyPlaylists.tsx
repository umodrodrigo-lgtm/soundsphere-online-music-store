import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ListMusic, Plus, Trash2, Globe, Lock } from 'lucide-react'
import { playlistsApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Playlist } from '@/types'
import { imgUrl } from '@/utils/format'
import toast from 'react-hot-toast'

export default function MyPlaylists() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', is_public: true })

  const { data, isLoading } = useQuery({
    queryKey: ['my-playlists'],
    queryFn: () => playlistsApi.mine({ limit: 50 }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => playlistsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
      setShowCreate(false)
      setForm({ title: '', description: '', is_public: true })
      toast.success('Playlist created!')
    },
    onError: () => toast.error('Failed to create playlist'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playlistsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
      toast.success('Playlist deleted')
    },
  })

  const playlists: Playlist[] = data?.data || []

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black font-display text-white">My Playlists</h1>
          <p className="text-slate-400 text-sm">{playlists.length} playlists</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[#1e1e2e] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create Playlist</h2>
            <div className="space-y-4">
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Playlist name"
                className="input-field"
              />
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={3}
                className="input-field resize-none"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="accent-purple-500" />
                <span className="text-slate-300 text-sm">Make public</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.title || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map(pl => (
            <div key={pl.id} className="card p-4 group relative">
              <Link to={`/playlists/${pl.id}`}>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center mb-3 overflow-hidden">
                  {pl.cover_image ? (
                    <img src={imgUrl(pl.cover_image)} alt={pl.title} className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-12 h-12 text-purple-400" />
                  )}
                </div>
                <h3 className="text-white font-semibold text-sm truncate mb-0.5">{pl.title}</h3>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  {pl.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{pl.song_count || 0} songs</span>
                </div>
              </Link>
              <button
                onClick={() => { if (confirm('Delete this playlist?')) deleteMutation.mutate(pl.id) }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <ListMusic className="w-20 h-20 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
          <p className="text-slate-500 mb-6">Create your first playlist to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Playlist
          </button>
        </div>
      )}
    </div>
  )
}
