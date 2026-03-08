import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/common/LoadingSpinner'

// ── Public pages
const Landing        = lazy(() => import('@/pages/public/Landing'))
const Browse         = lazy(() => import('@/pages/public/Browse'))
const SongDetail     = lazy(() => import('@/pages/public/SongDetail'))
const ArtistProfile  = lazy(() => import('@/pages/public/ArtistProfile'))
const ArtistsPage    = lazy(() => import('@/pages/public/ArtistsPage'))
const AlbumPage      = lazy(() => import('@/pages/public/AlbumPage'))
const PlaylistPage   = lazy(() => import('@/pages/public/PlaylistPage'))
const SubscriptionPage = lazy(() => import('@/pages/public/SubscriptionPage'))
const AboutPage      = lazy(() => import('@/pages/public/AboutPage'))

// ── Auth pages
const Login         = lazy(() => import('@/pages/auth/Login'))
const Register      = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))

// ── Customer dashboard
const CustomerDashboard = lazy(() => import('@/pages/customer/Dashboard'))
const CustomerProfile   = lazy(() => import('@/pages/customer/Profile'))
const LikedSongs        = lazy(() => import('@/pages/customer/LikedSongs'))
const ListeningHistory  = lazy(() => import('@/pages/customer/ListeningHistory'))
const MyPlaylists       = lazy(() => import('@/pages/customer/MyPlaylists'))
const Settings          = lazy(() => import('@/pages/customer/Settings'))

// ── Artist dashboard
const ArtistDashboard = lazy(() => import('@/pages/artist/Dashboard'))
const ArtistUpload    = lazy(() => import('@/pages/artist/UploadSong'))
const ArtistSongs     = lazy(() => import('@/pages/artist/MySongs'))
const ArtistAlbums    = lazy(() => import('@/pages/artist/Albums'))
const ArtistStats     = lazy(() => import('@/pages/artist/Stats'))
const ArtistEditProfile = lazy(() => import('@/pages/artist/EditProfile'))

// ── Admin dashboard
const AdminDashboard    = lazy(() => import('@/pages/admin/Dashboard'))
const AdminUsers        = lazy(() => import('@/pages/admin/Users'))
const AdminArtists      = lazy(() => import('@/pages/admin/Artists'))
const AdminSongs        = lazy(() => import('@/pages/admin/Songs'))
const AdminSubscriptions = lazy(() => import('@/pages/admin/Subscriptions'))
const AdminPlans        = lazy(() => import('@/pages/admin/Plans'))
const AdminGenres       = lazy(() => import('@/pages/admin/Genres'))

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public routes ─────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"            element={<Landing />} />
          <Route path="/browse"      element={<Browse />} />
          <Route path="/songs/:id"   element={<SongDetail />} />
          <Route path="/artists"     element={<ArtistsPage />} />
          <Route path="/artists/:id" element={<ArtistProfile />} />
          <Route path="/albums/:id"  element={<AlbumPage />} />
          <Route path="/playlists/:id" element={<PlaylistPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/about"       element={<AboutPage />} />
          <Route path="/trending"    element={<Browse />} />
        </Route>

        {/* ── Auth routes ───────────────────────────── */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Customer dashboard ───────────────────── */}
        <Route element={<DashboardLayout requiredRole="customer" />}>
          <Route path="/dashboard"  element={<CustomerDashboard />} />
          <Route path="/profile"    element={<CustomerProfile />} />
          <Route path="/liked"      element={<LikedSongs />} />
          <Route path="/history"    element={<ListeningHistory />} />
          <Route path="/playlists"  element={<MyPlaylists />} />
          <Route path="/settings"   element={<Settings />} />
        </Route>

        {/* ── Artist dashboard ─────────────────────── */}
        <Route element={<DashboardLayout requiredRole="artist" />}>
          <Route path="/artist"          element={<ArtistDashboard />} />
          <Route path="/artist/upload"   element={<ArtistUpload />} />
          <Route path="/artist/songs"    element={<ArtistSongs />} />
          <Route path="/artist/albums"   element={<ArtistAlbums />} />
          <Route path="/artist/stats"    element={<ArtistStats />} />
          <Route path="/artist/profile"  element={<ArtistEditProfile />} />
        </Route>

        {/* ── Admin dashboard ──────────────────────── */}
        <Route element={<DashboardLayout requiredRole="admin" />}>
          <Route path="/admin"                   element={<AdminDashboard />} />
          <Route path="/admin/users"             element={<AdminUsers />} />
          <Route path="/admin/artists"           element={<AdminArtists />} />
          <Route path="/admin/songs"             element={<AdminSongs />} />
          <Route path="/admin/subscriptions"     element={<AdminSubscriptions />} />
          <Route path="/admin/plans"             element={<AdminPlans />} />
          <Route path="/admin/genres"            element={<AdminGenres />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
