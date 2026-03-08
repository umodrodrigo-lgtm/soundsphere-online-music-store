import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import MusicPlayer from '@/components/player/MusicPlayer'
import { usePlayerStore } from '@/store/usePlayerStore'

export default function PublicLayout() {
  const { currentSong } = usePlayerStore()
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className={`pt-16 ${currentSong ? 'pb-[90px]' : ''}`}>
        <Outlet />
      </main>
      <MusicPlayer />
    </div>
  )
}
