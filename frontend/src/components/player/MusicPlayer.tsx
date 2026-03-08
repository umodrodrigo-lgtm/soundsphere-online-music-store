import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Heart, ListMusic, Maximize2, ChevronDown
} from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatDuration, imgUrl } from '@/utils/format'

export default function MusicPlayer() {
  const {
    currentSong, isPlaying, volume, progress, duration, isMuted,
    isRepeat, isShuffle,
    togglePlay, next, prev, setProgress, setDuration,
    setVolume, toggleMute, toggleRepeat, toggleShuffle,
  } = usePlayerStore()

  const audioRef = useRef<HTMLAudioElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(false)

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    const src = currentSong.audio_url.startsWith('http')
      ? currentSong.audio_url
      : currentSong.audio_url
    if (audio.src !== window.location.origin + src) {
      audio.src = src
      audio.load()
    }
    if (isPlaying) audio.play().catch(() => {})
    else           audio.pause()
  }, [currentSong, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Audio events
  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime)
  }
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }
  const handleEnded = () => next()

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setProgress(val)
    if (audioRef.current) audioRef.current.currentTime = val
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  if (!currentSong) return null

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Expanded overlay (mobile) */}
      {expanded && (
        <div className="fixed inset-0 z-[200] bg-gradient-to-b from-purple-900/80 to-[#0a0a0f] backdrop-blur-xl flex flex-col items-center justify-between p-8 pb-safe animate-fade-in md:hidden">
          <div className="w-full flex justify-end">
            <button onClick={() => setExpanded(false)} className="text-white/60 hover:text-white">
              <ChevronDown className="w-7 h-7" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-6 w-full">
            <img
              src={imgUrl(currentSong.cover_image)}
              alt={currentSong.title}
              className="w-72 h-72 rounded-3xl object-cover shadow-2xl shadow-purple-900/50"
            />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{currentSong.title}</h2>
              <p className="text-slate-400 mt-1">{currentSong.artist_name}</p>
            </div>

            {/* Progress */}
            <div className="w-full space-y-2">
              <input type="range" min={0} max={duration || 1} value={progress} step={0.5}
                onChange={handleSeek}
                className="w-full accent-purple-500 cursor-pointer"
                style={{ background: `linear-gradient(to right, #7c3aed ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%)` }}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{formatDuration(progress)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button onClick={toggleShuffle} className={isShuffle ? 'text-purple-400' : 'text-slate-500'}>
                <Shuffle className="w-6 h-6" />
              </button>
              <button onClick={prev} className="text-white hover:text-purple-400 transition-colors">
                <SkipBack className="w-8 h-8" fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/50 hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-7 h-7 text-white" fill="currentColor" /> : <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />}
              </button>
              <button onClick={next} className="text-white hover:text-purple-400 transition-colors">
                <SkipForward className="w-8 h-8" fill="currentColor" />
              </button>
              <button onClick={toggleRepeat} className={isRepeat ? 'text-purple-400' : 'text-slate-500'}>
                <Repeat className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="w-full flex items-center gap-3">
            <button onClick={toggleMute} className="text-slate-400">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={handleVolume} className="flex-1 accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Fixed bottom player bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] h-[90px] border-t border-white/5"
        style={{ background: 'linear-gradient(to top, #080808, #111118)' }}>
        <div className="max-w-screen-xl mx-auto h-full flex items-center gap-4 px-4">

          {/* Song info */}
          <div className="flex items-center gap-3 w-[220px] flex-shrink-0">
            <button onClick={() => setExpanded(true)} className="md:hidden">
              <img
                src={imgUrl(currentSong.cover_image)}
                alt={currentSong.title}
                className="w-12 h-12 rounded-xl object-cover"
              />
            </button>
            <img
              src={imgUrl(currentSong.cover_image)}
              alt={currentSong.title}
              className="w-12 h-12 rounded-xl object-cover hidden md:block flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
              <Link to={`/artists/${currentSong.artist_id}`} className="text-xs text-slate-500 hover:text-purple-400 truncate block transition-colors">
                {currentSong.artist_name}
              </Link>
            </div>
            <button
              onClick={() => setLiked(!liked)}
              className={`ml-1 flex-shrink-0 hidden md:block transition-colors ${liked ? 'text-pink-500' : 'text-slate-600 hover:text-pink-400'}`}
            >
              <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Center controls */}
          <div className="flex-1 flex flex-col items-center gap-1.5 max-w-md mx-auto">
            <div className="flex items-center gap-4 md:gap-6">
              <button onClick={toggleShuffle} className={`hidden md:block transition-colors ${isShuffle ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={prev} className="text-slate-300 hover:text-white transition-colors">
                <SkipBack className="w-5 h-5" fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {isPlaying
                  ? <Pause className="w-5 h-5 text-black" fill="currentColor" />
                  : <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                }
              </button>
              <button onClick={next} className="text-slate-300 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" fill="currentColor" />
              </button>
              <button onClick={toggleRepeat} className={`hidden md:block transition-colors ${isRepeat ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-[10px] text-slate-600 w-8 text-right">{formatDuration(progress)}</span>
              <div className="flex-1 relative">
                <input
                  type="range" min={0} max={duration || 1} value={progress} step={0.5}
                  onChange={handleSeek}
                  className="w-full cursor-pointer h-1 rounded-full appearance-none"
                  style={{
                    background: `linear-gradient(to right, #7c3aed ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%)`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-600 w-8">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-3 w-[180px] justify-end flex-shrink-0">
            <button className="text-slate-500 hover:text-white transition-colors">
              <ListMusic className="w-4 h-4" />
            </button>
            <button onClick={toggleMute} className="text-slate-500 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={handleVolume}
              className="w-24 cursor-pointer"
              style={{ background: `linear-gradient(to right, #7c3aed ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)` }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
