import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Globe, Instagram, Twitter, Youtube, Music } from 'lucide-react'
import { artistsApi, genresApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { imgUrl } from '@/utils/format'
import { Genre } from '@/types'
import toast from 'react-hot-toast'

export default function EditProfile() {
  const queryClient = useQueryClient()
  const profileRef  = useRef<HTMLInputElement>(null)
  const coverRef    = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['artist', 'profile'],
    queryFn: () => artistsApi.myProfile().then(r => r.data.data),
  })

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.list().then(r => r.data.data as Genre[]),
  })

  const [form, setForm] = useState<any>({})
  const [profileImg, setProfileImg]   = useState<File | null>(null)
  const [coverImg,   setCoverImg]     = useState<File | null>(null)
  const [profilePrev, setProfilePrev] = useState('')
  const [coverPrev,   setCoverPrev]   = useState('')

  React.useEffect(() => {
    if (profile) setForm({
      stage_name: profile.stage_name || '',
      bio:        profile.bio        || '',
      genre_id:   profile.genre_id   || '',
      country:    profile.country    || '',
      website:    profile.website    || '',
      instagram:  profile.instagram  || '',
      twitter:    profile.twitter    || '',
      youtube:    profile.youtube    || '',
    })
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (profileImg) fd.append('profile_image', profileImg)
      if (coverImg)   fd.append('cover_image', coverImg)
      return artistsApi.updateProfile(fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist'] })
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Update failed'),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-16" />

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black font-display text-white mb-8">Edit Artist Profile</h1>

      {/* Cover image */}
      <div className="relative h-48 rounded-2xl overflow-hidden mb-16 cursor-pointer group" onClick={() => coverRef.current?.click()}>
        <img
          src={coverPrev || imgUrl(profile?.cover_image, 'https://images.unsplash.com/photo-1501386761578-eaa54b292f16?w=800&h=300&fit=crop')}
          alt="Cover"
          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverImg(f); setCoverPrev(URL.createObjectURL(f)) } }} />

        {/* Profile photo */}
        <div className="absolute -bottom-12 left-6">
          <div className="relative cursor-pointer" onClick={e => { e.stopPropagation(); profileRef.current?.click() }}>
            <img
              src={profilePrev || imgUrl(profile?.profile_image)}
              alt={form.stage_name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#0f0f1a]"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input ref={profileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setProfileImg(f); setProfilePrev(URL.createObjectURL(f)) } }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Stage Name *</label>
            <input value={form.stage_name || ''} onChange={set('stage_name')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Genre</label>
            <select value={form.genre_id || ''} onChange={set('genre_id')} className="input-field">
              <option value="">Select genre</option>
              {(genres || []).map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Bio</label>
          <textarea value={form.bio || ''} onChange={set('bio')} rows={4} className="input-field resize-none" />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Country</label>
          <input value={form.country || ''} onChange={set('country')} className="input-field" />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Social Links</p>
          <div className="space-y-3">
            {[
              { key: 'website',   icon: Globe,     placeholder: 'https://yourwebsite.com' },
              { key: 'instagram', icon: Instagram,  placeholder: 'https://instagram.com/yourprofile' },
              { key: 'twitter',   icon: Twitter,   placeholder: 'https://twitter.com/yourhandle' },
              { key: 'youtube',   icon: Youtube,   placeholder: 'https://youtube.com/@yourchannel' },
            ].map(({ key, icon: Icon, placeholder }) => (
              <div key={key} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={form[key] || ''} onChange={set(key)} placeholder={placeholder} className="input-field pl-10" />
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary w-full py-3.5">
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
