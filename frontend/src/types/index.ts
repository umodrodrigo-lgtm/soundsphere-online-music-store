export interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url?: string
  bio?: string
  country?: string
  role: 'admin' | 'artist' | 'customer'
  role_id: number
  email_verified: boolean
  created_at: string
  artistProfile?: ArtistProfile | null
  subscription?: Subscription | null
}

export interface ArtistProfile {
  id: string
  user_id: string
  stage_name: string
  profile_image?: string
  cover_image?: string
  bio?: string
  genre_id?: number
  genre_name?: string
  genre_color?: string
  country?: string
  website?: string
  instagram?: string
  twitter?: string
  youtube?: string
  spotify_link?: string
  monthly_listeners: number
  total_plays: number
  follower_count?: number
  is_verified: boolean
  is_approved: boolean
  created_at: string
}

export interface Song {
  id: string
  title: string
  slug: string
  duration: number
  audio_url: string
  cover_image?: string
  lyrics?: string
  release_date?: string
  play_count: number
  like_count: number
  is_premium: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  // Joined
  artist_id: string
  artist_name: string
  artist_image?: string
  album_id?: string
  album_title?: string
  album_cover?: string
  genre_id?: number
  genre_name?: string
  genre_color?: string
  liked?: boolean
}

export interface Album {
  id: string
  artist_id: string
  title: string
  description?: string
  cover_image?: string
  genre_id?: number
  release_date?: string
  album_type: 'album' | 'ep' | 'single' | 'compilation'
  is_published: boolean
  track_count?: number
}

export interface Playlist {
  id: string
  user_id: string
  title: string
  description?: string
  cover_image?: string
  is_public: boolean
  song_count?: number
  songs?: Song[]
  username?: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Genre {
  id: number
  name: string
  slug: string
  color: string
  icon?: string
  song_count: number
}

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  max_accounts: number
  has_ads: boolean
  is_premium: boolean
  audio_quality: 'standard' | 'high' | 'lossless'
  features: string[]
  is_active: boolean
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: number
  plan_name: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  started_at: string
  expires_at?: string
  auto_renew: boolean
  is_premium?: boolean
  has_ads?: boolean
  audio_quality?: string
  features?: string[]
  price?: number
  billing_cycle?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  token?: string
  user?: User
}

export interface PlayerState {
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
}
