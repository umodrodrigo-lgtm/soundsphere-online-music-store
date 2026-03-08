import React, { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import MusicPlayer from '@/components/player/MusicPlayer'
import { useAuthStore } from '@/store/useAuthStore'
import { usePlayerStore } from '@/store/usePlayerStore'

interface DashboardLayoutProps {
  requiredRole?: 'admin' | 'artist' | 'customer'
}

export default function DashboardLayout({ requiredRole }: DashboardLayoutProps) {
  const { user } = useAuthStore()
  const { currentSong } = usePlayerStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-white/5 bg-[#0f0f1a] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold font-display">SoundSphere</span>
        </div>

        {/* Scrollable content */}
        <main className={`flex-1 overflow-y-auto ${currentSong ? 'pb-[90px]' : 'pb-6'}`}>
          <Outlet />
        </main>
      </div>

      <MusicPlayer />
    </div>
  )
}
