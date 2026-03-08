import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Music2, Image, X, CheckCircle2 } from 'lucide-react'
import { artistsApi, genresApi } from '@/services/api'
import { Genre } from '@/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function UploadSong() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const audioRef    = useRef<HTMLInputElement>(null)
  const coverRef    = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', genre_id: '', album_id: '', duration: '', lyrics: '',
    release_date: '', is_premium: false,
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [uploaded, setUploaded] = useState(false)

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.list().then(r => r.data.data as Genre[]),
  })

  const { data: albums } = useQuery({
    queryKey: ['artist', 'albums'],
    queryFn: () => artistsApi.stats().then(r => r.data.data?.albums || []),
  })

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => artistsApi.uploadSong(fd),
    onSuccess: () => {
      setUploaded(true)
      queryClient.invalidateQueries({ queryKey: ['artist'] })
      toast.success('Song uploaded! Pending admin review.')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile) { toast.error('Please select an audio file'); return }
    const fd = new FormData()
    fd.append('audio', audioFile)
    if (coverFile) fd.append('cover', coverFile)
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    uploadMutation.mutate(fd)
  }

  if (uploaded) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <CheckCircle2 className="w-20 h-20 text-green-400 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Song Uploaded!</h2>
      <p className="text-slate-400 mb-6">Your song is pending admin review. It will go live once approved.</p>
      <div className="flex gap-3">
        <button onClick={() => { setUploaded(false); setAudioFile(null); setCoverFile(null); setCoverPreview(''); setForm({ title: '', genre_id: '', album_id: '', duration: '', lyrics: '', release_date: '', is_premium: false }) }}
          className="btn-secondary">Upload Another</button>
        <button onClick={() => navigate('/artist/songs')} className="btn-primary">View My Songs</button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black font-display text-white mb-2">Upload Song</h1>
      <p className="text-slate-400 mb-8">Share your music with SoundSphere listeners</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Audio file */}
        <div
          onClick={() => audioRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${audioFile ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'}`}
        >
          <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
          {audioFile ? (
            <div className="flex items-center justify-center gap-3">
              <Music2 className="w-8 h-8 text-purple-400" />
              <div className="text-left">
                <p className="text-white font-medium">{audioFile.name}</p>
                <p className="text-slate-400 text-sm">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setAudioFile(null) }} className="ml-auto text-slate-500 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Drop your audio file here</p>
              <p className="text-slate-500 text-sm">MP3, WAV, FLAC, AAC — up to 50 MB</p>
            </>
          )}
        </div>

        {/* Cover + basic fields */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Cover */}
          <div
            onClick={() => coverRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
          >
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Image className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Add Cover Art</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Song Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter song title" required className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Genre</label>
                <select value={form.genre_id} onChange={e => setForm(f => ({ ...f, genre_id: e.target.value }))}
                  className="input-field">
                  <option value="">Select genre</option>
                  {(genres || []).map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration (sec)</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 214" className="input-field" min={1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Album</label>
                <select value={form.album_id} onChange={e => setForm(f => ({ ...f, album_id: e.target.value }))}
                  className="input-field">
                  <option value="">Single (no album)</option>
                  {(albums || []).map((a: any) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Release Date</label>
                <input type="date" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))}
                  className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Lyrics (optional)</label>
          <textarea value={form.lyrics} onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))}
            rows={6} placeholder="Paste song lyrics here..." className="input-field resize-none font-mono text-sm" />
        </div>

        {/* Premium toggle */}
        <label className="flex items-center gap-3 cursor-pointer card p-4">
          <div>
            <p className="text-white font-medium text-sm">Premium Song</p>
            <p className="text-slate-500 text-xs">Only premium subscribers can listen</p>
          </div>
          <div className="ml-auto">
            <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))}
              className="sr-only peer" id="premium-toggle" />
            <label htmlFor="premium-toggle" className="relative inline-flex w-10 h-6 bg-slate-700 peer-checked:bg-purple-600 rounded-full cursor-pointer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </div>
        </label>

        <button type="submit" disabled={uploadMutation.isPending || !audioFile} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
          {uploadMutation.isPending ? <><LoadingSpinner size="sm" /> Uploading...</> : <><Upload className="w-5 h-5" /> Upload Song</>}
        </button>
      </form>
    </div>
  )
}
