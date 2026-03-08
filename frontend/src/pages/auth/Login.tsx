import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Music2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import Logo from '@/components/common/Logo'
import toast from 'react-hot-toast'

export default function Login() {
  const { user, login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'artist' ? '/artist' : '/dashboard'} replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      const u = useAuthStore.getState().user
      navigate(u?.role === 'admin' ? '/admin' : u?.role === 'artist' ? '/artist' : '/dashboard')
      toast.success('Welcome back! 🎵')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo size="md" className="mb-8" />
            <h1 className="text-3xl font-black font-display text-white mb-2">Welcome back</h1>
            <p className="text-slate-400">Sign in to continue your music journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-purple-400 hover:text-purple-300 text-sm">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="input-field pl-11 pr-11"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-slate-400 text-xs mb-3 font-medium uppercase tracking-wider">Demo accounts</p>
            {[
              { label: 'Admin',    email: 'admin@soundsphere.com',  pass: 'Admin@123' },
              { label: 'Artist',   email: 'aria.nova@example.com',  pass: 'password' },
              { label: 'Customer', email: 'john.doe@example.com',   pass: 'password' },
            ].map(({ label, email: e, pass }) => (
              <button key={label}
                onClick={() => { setEmail(e); setPassword(pass) }}
                className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg hover:bg-white/8 transition-colors text-left"
              >
                <span className="text-white text-sm font-medium">{label}</span>
                <span className="text-slate-500 text-xs font-mono">{e}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">Sign up free</Link>
          </p>
        </div>
      </div>

      {/* Right – decorative */}
      <div className="hidden lg:block flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=1200&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Now Playing</p>
                <p className="text-slate-400 text-sm">Electric Sky – Aria Nova</p>
              </div>
            </div>
            <div className="h-1 bg-white/10 rounded-full">
              <div className="h-1 bg-purple-500 rounded-full w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
