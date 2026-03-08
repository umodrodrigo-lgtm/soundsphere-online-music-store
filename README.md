# 🎵 SoundSphere — Full-Stack Music Streaming Platform

A production-style music streaming web application built with React, Node.js, Express, and MySQL.

---

## 🚀 Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS |
| State      | Zustand + React Query |
| Backend    | Node.js, Express.js |
| Database   | MySQL 8+ |
| Auth       | JWT (Role-based: admin / artist / customer) |
| Uploads    | Multer (local → easily migratable to S3) |

---

## 📁 Project Structure

```
SoundSphere/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, upload, validate
│   │   ├── routes/         # Express routers
│   │   └── server.js       # Entry point
│   ├── uploads/            # Audio & image storage
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Public, auth, customer, artist, admin
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # Axios API layer
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Formatting helpers
│   └── vite.config.ts
└── database/
    ├── schema.sql          # Full DB schema
    ├── seed.sql            # Sample data
    ├── migrate.js          # Migration runner
    └── seed.js             # Seed runner
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Database

```bash
# Create DB and run schema
mysql -u root -p < database/schema.sql

# Or use the node runner:
cd database
node migrate.js
node seed.js
```

### 2. Backend

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

npm run dev     # Development (nodemon)
npm start       # Production
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

---

## 🔑 Demo Accounts

| Role     | Email                       | Password  |
|----------|-----------------------------|-----------|
| Admin    | admin@soundsphere.com       | Admin@123 |
| Artist   | aria.nova@example.com       | password  |
| Customer | john.doe@example.com        | password  |

---

## 🗄️ Database Schema (ERD Summary)

```
users ──────┬── artist_profiles ──┬── songs ──┬── song_likes
            │                    ├── albums  │
            ├── subscriptions     └── genres  └── listening_history
            │     └── payments
            ├── playlists ── playlist_songs
            ├── notifications
            └── artist_followers
```

**Key tables:**
- `users` — all users (admin/artist/customer) with role FK
- `artist_profiles` — extended profile for artist accounts
- `songs` — tracks with audio_url, cover, genre, album, status
- `albums` — organized collections of songs
- `subscription_plans` — pricing tiers with features JSON
- `subscriptions` — user ↔ plan assignments with status
- `payments` — simulated payment records

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Songs
```
GET  /api/songs              ?search= &genre= &page=
GET  /api/songs/trending
GET  /api/songs/latest
GET  /api/songs/:id
POST /api/songs/:id/play
POST /api/songs/:id/like     (toggle, auth required)
GET  /api/songs/liked        (auth required)
```

### Artists
```
GET  /api/artists            ?search= &page=
GET  /api/artists/:id
POST /api/artists/:id/follow (toggle, auth required)
GET  /api/artists/me/profile  (artist only)
PUT  /api/artists/me/profile  (artist only, multipart)
GET  /api/artists/me/songs    (artist only)
POST /api/artists/me/songs    (artist only, multipart: audio + cover)
PUT  /api/artists/me/songs/:id
DELETE /api/artists/me/songs/:id
GET  /api/artists/me/stats
POST /api/artists/me/albums
```

### Playlists
```
GET  /api/playlists/public
GET  /api/playlists           (auth: own playlists)
POST /api/playlists
GET  /api/playlists/:id
PUT  /api/playlists/:id
DELETE /api/playlists/:id
POST /api/playlists/:id/songs
DELETE /api/playlists/:id/songs/:songId
```

### Subscriptions
```
GET  /api/subscription-plans/plans
GET  /api/subscriptions/me
POST /api/subscriptions/subscribe
POST /api/subscriptions/cancel
```

### Admin
```
GET  /api/admin/dashboard
GET  /api/admin/users
PUT  /api/admin/users/:id
GET  /api/admin/songs         ?status= &search=
PUT  /api/admin/songs/:id/approve
DELETE /api/admin/songs/:id
GET  /api/admin/artists
PUT  /api/admin/artists/:id
GET  /api/admin/subscriptions
GET  /api/admin/plans
POST /api/admin/plans
PUT  /api/admin/plans/:id
GET  /api/admin/genres
```

---

## 👥 User Roles & Features

### Customer
- Browse and search songs by genre, artist, trending, latest
- Full music player (play/pause, skip, seek, volume, shuffle, repeat)
- Like/favorite songs
- Create and manage playlists
- View listening history
- Subscribe to plans (simulated payment flow)
- Profile management

### Artist
- Upload songs (MP3/WAV/FLAC + cover art)
- Create albums and organize tracks
- View analytics: plays, likes, followers, top songs
- Edit artist profile with bio, social links, photos
- Songs require admin approval before going public

### Admin
- Dashboard with platform-wide stats and charts
- Approve/reject uploaded songs
- Manage users (activate/deactivate)
- Approve/verify artist profiles
- Manage subscription plans and pricing
- View all subscriptions and revenue

---

## 🎨 UI Features

- **Dark theme** with glass morphism cards
- **Gradient hero** sections with Unsplash imagery
- **Fixed bottom music player** with full controls
- **Animated equalizer** bars on active songs
- **Responsive** — works on mobile, tablet, desktop
- **Sidebar navigation** for dashboards
- **Role-based routing** with protected routes

---

## 🔮 Production Upgrade Path

| Feature      | Current          | Production Ready         |
|--------------|------------------|--------------------------|
| File Storage | Local `uploads/` | AWS S3 / Cloudflare R2   |
| Payments     | Simulated        | Stripe / PayPal          |
| Email        | Console log      | SendGrid / Resend        |
| Auth         | JWT stateless    | + Refresh tokens / Redis |
| Deployment   | Local            | Docker + Nginx + PM2     |
