import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Compass, Music2, Library, Heart, Clock, ListMusic,
  TrendingUp, Star, Users, LayoutDashboard, Upload, BarChart2,
  Settings, Shield, UserCheck
} from 'lucide-react'
import Logo from '@/components/common/Logo'
import { useAuthStore } from '@/store/useAuthStore'

const customerLinks = [
  { to: '/dashboard',     icon: Home,       label: 'Home' },
  { to: '/browse',        icon: Compass,    label: 'Browse' },
  { to: '/trending',      icon: TrendingUp, label: 'Trending' },
  { to: '/liked',         icon: Heart,      label: 'Liked Songs' },
  { to: '/history',       icon: Clock,      label: 'History' },
  { to: '/playlists',     icon: ListMusic,  label: 'My Playlists' },
  { to: '/artists',       icon: Users,      label: 'Artists' },
  { to: '/subscription',  icon: Star,       label: 'Premium' },
]

const artistLinks = [
  { to: '/artist',              icon: LayoutDashboard, label: 'Overview' },
  { to: '/artist/upload',       icon: Upload,          label: 'Upload Song' },
  { to: '/artist/songs',        icon: Music2,          label: 'My Songs' },
  { to: '/artist/albums',       icon: Library,         label: 'Albums' },
  { to: '/artist/stats',        icon: BarChart2,       label: 'Analytics' },
  { to: '/artist/profile',      icon: UserCheck,       label: 'Profile' },
]

const adminLinks = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',         icon: Users,           label: 'Users' },
  { to: '/admin/artists',       icon: UserCheck,       label: 'Artists' },
  { to: '/admin/songs',         icon: Music2,          label: 'Songs' },
  { to: '/admin/subscriptions', icon: Star,            label: 'Subscriptions' },
  { to: '/admin/plans',         icon: Shield,          label: 'Plans' },
  { to: '/admin/genres',        icon: Library,         label: 'Genres' },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const links = user?.role === 'admin' ? adminLinks : user?.role === 'artist' ? artistLinks : customerLinks

  return (
    <aside className="flex flex-col h-full w-64 bg-[#0f0f1a] border-r border-white/5 overflow-y-auto">
      <div className="p-5 border-b border-white/5">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/artist' || to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
