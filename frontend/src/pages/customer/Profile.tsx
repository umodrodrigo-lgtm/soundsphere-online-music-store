import React, { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, Crown, Calendar } from 'lucide-react'
import { usersApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { avatarUrl, formatDate, formatCurrency } from '@/utils/format'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { user, setUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    username:     user?.username     || '',
    bio:          user?.bio          || '',
    country:      user?.country      || '',
  })

  const updateMutation = useMutation({
    mutationFn: (fd: FormData) => usersApi.updateProfile(fd),
    onSuccess: (res) => {
      setUser({ ...user!, ...res.data.user })
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Update failed'),
  })

  const handleSave = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    updateMutation.mutate(fd)
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    updateMutation.mutate(fd)
  }

  const sub = user?.subscription

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black font-display text-white mb-8">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img
            src={avatarUrl(user?.avatar_url, user?.display_name)}
            alt={user?.display_name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500/30"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-500 p-2 rounded-full transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.display_name}</h2>
          <p className="text-slate-400 text-sm">@{user?.username}</p>
          <p className="text-slate-500 text-xs mt-1">Member since {formatDate(user?.created_at || '')}</p>
        </div>
      </div>

      {/* Subscription */}
      <div className={`rounded-2xl p-4 mb-8 flex items-center gap-4 ${sub?.is_premium ? 'bg-purple-900/30 border border-purple-500/20' : 'bg-white/5 border border-white/10'}`}>
        <Crown className={`w-8 h-8 flex-shrink-0 ${sub?.is_premium ? 'text-yellow-400' : 'text-slate-600'}`} />
        <div className="flex-1">
          <p className="text-white font-semibold">{sub?.plan_name || 'Free Plan'}</p>
          {sub?.expires_at && (
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Renews {formatDate(sub.expires_at)}
            </p>
          )}
        </div>
        {sub?.price && <span className="text-white font-bold">{formatCurrency(sub.price)}<span className="text-slate-400 text-xs">/{sub.billing_cycle}</span></span>}
      </div>

      {/* Edit form */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white mb-2">Edit Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Display Name</label>
            <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Bio</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Country</label>
          <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
            placeholder="Your country" className="input-field" />
        </div>
        <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary w-full">
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
