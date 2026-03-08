export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const formatNumber = (n: number): string => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export const formatDate = (d?: string): string => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatCurrency = (amount: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

export const imgUrl = (url?: string | null, fallback = 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400&h=400&fit=crop'): string => {
  if (!url) return fallback
  if (url.startsWith('http')) return url
  return url  // relative path served by backend
}

export const avatarUrl = (url?: string | null, name = 'User'): string => {
  if (url) return imgUrl(url)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=200`
}
