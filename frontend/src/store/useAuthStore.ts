import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { authApi } from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login:  (email: string, password: string) => Promise<void>
  register: (data: Record<string, unknown>) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login({ email, password })
          localStorage.setItem('ss_token', data.token)
          set({ user: data.user, token: data.token })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (formData) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register(formData)
          localStorage.setItem('ss_token', data.token)
          set({ user: data.user, token: data.token })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('ss_token')
        set({ user: null, token: null })
      },

      refreshUser: async () => {
        try {
          const { data } = await authApi.me()
          set({ user: data.user })
        } catch {
          get().logout()
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'ss_auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
)
