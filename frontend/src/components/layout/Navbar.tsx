import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, LogOut, User, Settings, LayoutDashboard, Menu, X } from 'lucide-react'
import Logo from '@/components/common/Logo'
import { useAuthStore } from '@/store/useAuthStore'
import { avatarUrl } from '@/utils/format'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showMobile, setShowMobile] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/browse?q=${encodeURIComponent(search.trim())}`)
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'artist' ? '/artist' : '/dashboard'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/5">
      <div className="max-w-screen-xl mx-auto h-full flex items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Logo size="sm" className="flex-shrink-0" />

        {/* Nav links – hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {[['/', 'Home'], ['/browse', 'Browse'], ['/artists', 'Artists'], ['/subscription', 'Premium']].map(([to, label]) => (
            <Link key={to} to={to} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search songs, artists..."
              className="w-full bg-white/8 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <button className="hidden md:flex p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/15 rounded-full pl-1 pr-3 py-1 transition-colors"
                >
                  <img
                    src={avatarUrl(user.avatar_url, user.display_name)}
                    alt={user.display_name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/30"
                  />
                  <span className="text-sm text-white hidden md:block max-w-[100px] truncate">{user.display_name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                      <p className="text-white font-medium text-sm truncate">{user.display_name}</p>
                      <p className="text-slate-500 text-xs truncate">{user.email}</p>
                    </div>
                    {[
                      [dashboardPath, <LayoutDashboard className="w-4 h-4" />, 'Dashboard'],
                      ['/profile', <User className="w-4 h-4" />, 'Profile'],
                      ['/settings', <Settings className="w-4 h-4" />, 'Settings'],
                    ].map(([to, icon, label]) => (
                      <Link
                        key={to as string}
                        to={to as string}
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
                      >
                        {icon as React.ReactNode}
                        {label as string}
                      </Link>
                    ))}
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setShowMenu(false); navigate('/') }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm py-2">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setShowMobile(!showMobile)}
          >
            {showMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobile && (
        <div className="md:hidden bg-[#0f0f1a] border-t border-white/5 px-4 py-3 space-y-1">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/8 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </form>
          {[['/', 'Home'], ['/browse', 'Browse'], ['/artists', 'Artists'], ['/subscription', 'Premium']].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setShowMobile(false)}
              className="block px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8">
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
