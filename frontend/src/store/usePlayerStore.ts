import { create } from 'zustand'
import { Song } from '@/types'
import { songsApi } from '@/services/api'

interface PlayerStore {
  currentSong: Song | null
  queue: Song[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  isRepeat: boolean
  isShuffle: boolean
  isMuted: boolean

  playSong:      (song: Song, queue?: Song[]) => void
  togglePlay:    () => void
  next:          () => void
  prev:          () => void
  setProgress:   (p: number) => void
  setDuration:   (d: number) => void
  setVolume:     (v: number) => void
  toggleMute:    () => void
  toggleRepeat:  () => void
  toggleShuffle: () => void
  addToQueue:    (song: Song) => void
  clearQueue:    () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  queue:       [],
  queueIndex:  0,
  isPlaying:   false,
  volume:      0.8,
  progress:    0,
  duration:    0,
  isRepeat:    false,
  isShuffle:   false,
  isMuted:     false,

  playSong: (song, queue) => {
    const newQueue = queue || [song]
    const idx = newQueue.findIndex(s => s.id === song.id)
    set({
      currentSong: song,
      queue: newQueue,
      queueIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
      progress: 0,
    })
    // Record play
    songsApi.play(song.id).catch(() => {})
  },

  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, queueIndex, isShuffle, isRepeat, currentSong } = get()
    if (!queue.length) return
    if (isRepeat && currentSong) {
      set({ progress: 0, isPlaying: true })
      return
    }
    let next = isShuffle
      ? Math.floor(Math.random() * queue.length)
      : queueIndex + 1
    if (next >= queue.length) next = 0
    const song = queue[next]
    set({ currentSong: song, queueIndex: next, isPlaying: true, progress: 0 })
    songsApi.play(song.id).catch(() => {})
  },

  prev: () => {
    const { queue, queueIndex, progress } = get()
    if (!queue.length) return
    // If past 3s, restart current; else go back
    if (progress > 3) {
      set({ progress: 0 })
      return
    }
    let prev = queueIndex - 1
    if (prev < 0) prev = queue.length - 1
    const song = queue[prev]
    set({ currentSong: song, queueIndex: prev, isPlaying: true, progress: 0 })
    songsApi.play(song.id).catch(() => {})
  },

  setProgress:   (p) => set({ progress: p }),
  setDuration:   (d) => set({ duration: d }),
  setVolume:     (v) => set({ volume: v, isMuted: v === 0 }),
  toggleMute:    () => set(s => ({ isMuted: !s.isMuted })),
  toggleRepeat:  () => set(s => ({ isRepeat: !s.isRepeat })),
  toggleShuffle: () => set(s => ({ isShuffle: !s.isShuffle })),

  addToQueue: (song) => set(s => ({
    queue: [...s.queue, song],
  })),

  clearQueue: () => set({ queue: [], queueIndex: 0 }),
}))
