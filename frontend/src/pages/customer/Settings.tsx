import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lock, Bell, Shield, Trash2 } from 'lucide-react'
import { usersApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })

  const pwMutation = useMutation({
    mutationFn: () => usersApi.changePassword({
      current_password: pwForm.current_password,
      new_password:     pwForm.new_password,
    }),
    onSuccess: () => {
      toast.success('Password changed!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error("Passwords don't match"); return
    }
    pwMutation.mutate()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black font-display text-white">Settings</h1>

      {/* Account info */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" /> Account
        </h2>
        <div className="space-y-3 text-sm">
          {[['Email', user?.email], ['Username', `@${user?.username}`], ['Role', user?.role], ['Joined', user?.created_at?.slice(0,10)]].map(([label, value]) => (
            <div key={label as string} className="flex justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-slate-400">{label}</span>
              <span className="text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-400" /> Change Password
        </h2>
        <form onSubmit={handlePwSubmit} className="space-y-3">
          {[
            ['current_password', 'Current Password'],
            ['new_password',     'New Password'],
            ['confirm',          'Confirm New Password'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm text-slate-400 mb-1">{label}</label>
              <input
                type="password"
                value={(pwForm as any)[key]}
                onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                required minLength={key !== 'current_password' ? 8 : 1}
                className="input-field"
              />
            </div>
          ))}
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary">
            {pwMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" /> Notifications
        </h2>
        {[
          ['New releases from followed artists', true],
          ['Playlist recommendations', true],
          ['Subscription reminders', true],
          ['Promotional emails', false],
        ].map(([label, def]) => (
          <div key={label as string} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-slate-300 text-sm">{label as string}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={def as boolean} className="sr-only peer" />
              <div className="w-10 h-6 bg-slate-700 peer-checked:bg-purple-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-500/20">
        <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h2>
        <button
          onClick={() => { if (confirm('Sign out?')) logout() }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
