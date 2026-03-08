import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_token')
      localStorage.removeItem('ss_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────
export const authApi = {
  register:       (data: Record<string, unknown>) => api.post('/auth/register', data),
  login:          (data: Record<string, unknown>) => api.post('/auth/login', data),
  me:             ()              => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data: Record<string, unknown>) => api.post('/auth/reset-password', data),
}

// ─── Songs ───────────────────────────────────────────────────────
export const songsApi = {
  list:      (params?: Record<string, unknown>) => api.get('/songs', { params }),
  trending:  (limit = 10) => api.get('/songs/trending', { params: { limit } }),
  latest:    (limit = 10) => api.get('/songs/latest',   { params: { limit } }),
  get:       (id: string) => api.get(`/songs/${id}`),
  play:      (id: string, duration_s = 0) => api.post(`/songs/${id}/play`, { duration_s }),
  like:      (id: string) => api.post(`/songs/${id}/like`),
  liked:     (params?: Record<string, unknown>) => api.get('/songs/liked', { params }),
}

// ─── Artists ─────────────────────────────────────────────────────
export const artistsApi = {
  list:          (params?: Record<string, unknown>) => api.get('/artists', { params }),
  get:           (id: string) => api.get(`/artists/${id}`),
  follow:        (id: string) => api.post(`/artists/${id}/follow`),
  myProfile:     () => api.get('/artists/me/profile'),
  updateProfile: (data: FormData) => api.put('/artists/me/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  mySongs:       (params?: Record<string, unknown>) => api.get('/artists/me/songs', { params }),
  uploadSong:    (data: FormData) => api.post('/artists/me/songs', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSong:    (id: string, data: FormData) => api.put(`/artists/me/songs/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteSong:    (id: string) => api.delete(`/artists/me/songs/${id}`),
  stats:         () => api.get('/artists/me/stats'),
  createAlbum:   (data: FormData) => api.post('/artists/me/albums', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ─── Playlists ───────────────────────────────────────────────────
export const playlistsApi = {
  mine:       (params?: Record<string, unknown>) => api.get('/playlists', { params }),
  public:     (params?: Record<string, unknown>) => api.get('/playlists/public', { params }),
  get:        (id: string) => api.get(`/playlists/${id}`),
  create:     (data: FormData | Record<string, unknown>) => api.post('/playlists', data),
  update:     (id: string, data: Record<string, unknown>) => api.put(`/playlists/${id}`, data),
  delete:     (id: string) => api.delete(`/playlists/${id}`),
  addSong:    (id: string, song_id: string) => api.post(`/playlists/${id}/songs`, { song_id }),
  removeSong: (id: string, songId: string) => api.delete(`/playlists/${id}/songs/${songId}`),
}

// ─── Subscriptions ───────────────────────────────────────────────
export const subsApi = {
  plans:     () => api.get('/subscription-plans/plans'),
  me:        () => api.get('/subscriptions/me'),
  subscribe: (plan_id: number, payment_method?: string) => api.post('/subscriptions/subscribe', { plan_id, payment_method }),
  cancel:    () => api.post('/subscriptions/cancel'),
}

// ─── Users ───────────────────────────────────────────────────────
export const usersApi = {
  updateProfile: (data: FormData) => api.put('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data: Record<string, unknown>) => api.put('/users/me/password', data),
  history:        (params?: Record<string, unknown>) => api.get('/users/me/history', { params }),
  notifications:  () => api.get('/users/me/notifications'),
}

// ─── Genres ──────────────────────────────────────────────────────
export const genresApi = {
  list: () => api.get('/genres'),
}

// ─── Admin ───────────────────────────────────────────────────────
export const adminApi = {
  dashboard:    () => api.get('/admin/dashboard'),
  users:        (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  updateUser:   (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  songs:        (params?: Record<string, unknown>) => api.get('/admin/songs', { params }),
  approveSong:  (id: string, status: 'approved' | 'rejected') => api.put(`/admin/songs/${id}/approve`, { status }),
  deleteSong:   (id: string) => api.delete(`/admin/songs/${id}`),
  artists:      (params?: Record<string, unknown>) => api.get('/admin/artists', { params }),
  updateArtist: (id: string, data: Record<string, unknown>) => api.put(`/admin/artists/${id}`, data),
  subscriptions:(params?: Record<string, unknown>) => api.get('/admin/subscriptions', { params }),
  plans:        () => api.get('/admin/plans'),
  createPlan:   (data: Record<string, unknown>) => api.post('/admin/plans', data),
  updatePlan:   (id: number, data: Record<string, unknown>) => api.put(`/admin/plans/${id}`, data),
  genres:       () => api.get('/admin/genres'),
}

export default api
