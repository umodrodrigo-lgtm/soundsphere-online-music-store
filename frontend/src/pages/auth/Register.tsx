import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Mic2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import Logo from '@/components/common/Logo'
import toast from 'react-hot-toast'

export default function Register() {
  const { user, register, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '', role: 'customer' })
  const [showPass, setShowPass] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(form)
      toast.success('Account created! Welcome to SoundSphere 🎵')
      const u = useAuthStore.getState().user
      navigate(u?.role === 'artist' ? '/artist' : '/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left decorative */}
      <div className="hidden lg:block flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1200&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0f] to-transparent" />
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Logo size="md" className="mb-8" />
          <h1 className="text-3xl font-black font-display text-white mb-2">Create account</h1>
          <p className="text-slate-400 mb-8">Join millions of music lovers today</p>

          {/* Role toggle */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-6">
            {[
              { value: 'customer', icon: User, label: 'Listener' },
              { value: 'artist',   icon: Mic2, label: 'Artist' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: value }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.role === value ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                <input value={form.display_name} onChange={set('display_name')} placeholder="Your name" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                  <input value={form.username} onChange={set('username')} placeholder="username" required
                    pattern="[a-zA-Z0-9_]{3,30}" title="3-30 chars, letters/numbers/underscore"
                    className="input-field pl-7" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required
                  className="input-field pl-11" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="Min 8 characters" required minLength={8} className="input-field pl-11 pr-11" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1 accent-purple-500" />
              <span className="text-sm text-slate-400">
                I agree to the{' '}
                <a href="#" className="text-purple-400 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>
              </span>
            </label>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
              {isLoading ? 'Creating account...' : `Create ${form.role === 'artist' ? 'Artist' : 'Listener'} Account`}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
