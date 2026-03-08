import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { authApi } from '@/services/api'
import Logo from '@/components/common/Logo'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const token     = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Logo size="md" className="mb-8" />
        <h1 className="text-3xl font-black font-display text-white mb-2">New password</h1>
        <p className="text-slate-400 mb-8">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters" required minLength={8} className="input-field pl-11" />
          </div>
          <button type="submit" disabled={loading || !token} className="btn-primary w-full py-3.5">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <Link to="/login" className="block text-center text-slate-400 hover:text-white mt-6 text-sm">Back to login</Link>
      </div>
    </div>
  )
}
