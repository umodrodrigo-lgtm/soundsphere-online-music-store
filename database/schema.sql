-- ============================================================
-- SoundSphere Music Streaming Platform - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS soundsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE soundsphere;

-- ─────────────────────────────────────────────────────────────
-- ROLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id         TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  role_id           TINYINT UNSIGNED NOT NULL DEFAULT 3,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  username          VARCHAR(100) NOT NULL UNIQUE,
  display_name      VARCHAR(150),
  avatar_url        VARCHAR(500),
  bio               TEXT,
  country           VARCHAR(100),
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  email_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
  reset_token       VARCHAR(255),
  reset_token_exp   DATETIME,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ─────────────────────────────────────────────────────────────
-- GENRES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS genres (
  id         SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  color      VARCHAR(20)  DEFAULT '#6366f1',
  icon       VARCHAR(50),
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- ARTIST PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_profiles (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL UNIQUE,
  stage_name      VARCHAR(150) NOT NULL,
  profile_image   VARCHAR(500),
  cover_image     VARCHAR(500),
  bio             TEXT,
  genre_id        SMALLINT UNSIGNED,
  country         VARCHAR(100),
  website         VARCHAR(255),
  instagram       VARCHAR(255),
  twitter         VARCHAR(255),
  youtube         VARCHAR(255),
  spotify_link    VARCHAR(255),
  monthly_listeners INT UNSIGNED DEFAULT 0,
  total_plays     BIGINT UNSIGNED DEFAULT 0,
  is_verified     BOOLEAN      DEFAULT FALSE,
  is_approved     BOOLEAN      DEFAULT FALSE,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- ALBUMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS albums (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  artist_id    CHAR(36)     NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  cover_image  VARCHAR(500),
  genre_id     SMALLINT UNSIGNED,
  release_date DATE,
  album_type   ENUM('album','ep','single','compilation') DEFAULT 'album',
  is_published BOOLEAN      DEFAULT FALSE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id)  REFERENCES genres(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- SONGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  artist_id     CHAR(36)     NOT NULL,
  album_id      CHAR(36),
  genre_id      SMALLINT UNSIGNED,
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(300) NOT NULL UNIQUE,
  duration      INT UNSIGNED DEFAULT 0,
  audio_url     VARCHAR(500) NOT NULL,
  cover_image   VARCHAR(500),
  lyrics        LONGTEXT,
  release_date  DATE,
  play_count    BIGINT UNSIGNED DEFAULT 0,
  like_count    INT UNSIGNED    DEFAULT 0,
  is_premium    BOOLEAN         DEFAULT FALSE,
  status        ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME,
  FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id)  REFERENCES albums(id) ON DELETE SET NULL,
  FOREIGN KEY (genre_id)  REFERENCES genres(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- SONG LIKES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS song_likes (
  user_id    CHAR(36)  NOT NULL,
  song_id    CHAR(36)  NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- PLAYLISTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  is_public   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- PLAYLIST SONGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id CHAR(36)      NOT NULL,
  song_id     CHAR(36)      NOT NULL,
  position    SMALLINT UNSIGNED DEFAULT 0,
  added_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id)     REFERENCES songs(id)     ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- SUBSCRIPTION PLANS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency        VARCHAR(10)   DEFAULT 'USD',
  billing_cycle   ENUM('monthly','yearly','lifetime') DEFAULT 'monthly',
  max_accounts    TINYINT UNSIGNED DEFAULT 1,
  has_ads         BOOLEAN      DEFAULT TRUE,
  is_premium      BOOLEAN      DEFAULT FALSE,
  audio_quality   ENUM('standard','high','lossless') DEFAULT 'standard',
  features        JSON,
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- USER SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  user_id         CHAR(36)      NOT NULL,
  plan_id         SMALLINT UNSIGNED NOT NULL,
  status          ENUM('active','expired','cancelled','pending') DEFAULT 'pending',
  started_at      DATETIME,
  expires_at      DATETIME,
  cancelled_at    DATETIME,
  auto_renew      BOOLEAN       DEFAULT TRUE,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)              ON DELETE CASCADE,
  FOREIGN KEY (plan_id)  REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS (simulated)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               CHAR(36)      NOT NULL PRIMARY KEY,
  user_id          CHAR(36)      NOT NULL,
  subscription_id  CHAR(36),
  amount           DECIMAL(10,2) NOT NULL,
  currency         VARCHAR(10)   DEFAULT 'USD',
  status           ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  payment_method   VARCHAR(100)  DEFAULT 'simulated',
  transaction_ref  VARCHAR(255),
  paid_at          DATETIME,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- LISTENING HISTORY
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listening_history (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    CHAR(36)  NOT NULL,
  song_id    CHAR(36)  NOT NULL,
  played_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_s INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  INDEX idx_user_played (user_id, played_at),
  INDEX idx_song_played (song_id, played_at)
);

-- ─────────────────────────────────────────────────────────────
-- BANNERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255),
  subtitle    TEXT,
  image_url   VARCHAR(500),
  link_url    VARCHAR(500),
  position    TINYINT UNSIGNED DEFAULT 0,
  is_active   BOOLEAN   DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     CHAR(36)  NOT NULL,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(255),
  message     TEXT,
  is_read     BOOLEAN   DEFAULT FALSE,
  data        JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
);

-- ─────────────────────────────────────────────────────────────
-- ADMIN LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id    CHAR(36)  NOT NULL,
  action      VARCHAR(255) NOT NULL,
  target_type VARCHAR(100),
  target_id   VARCHAR(100),
  details     JSON,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- ARTIST FOLLOWERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_followers (
  user_id     CHAR(36)  NOT NULL,
  artist_id   CHAR(36)  NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, artist_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)           ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- VIEWS (Convenience)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_songs_full AS
SELECT
  s.id, s.title, s.slug, s.duration, s.audio_url, s.cover_image,
  s.lyrics, s.release_date, s.play_count, s.like_count,
  s.is_premium, s.status, s.created_at,
  a.id         AS artist_id,
  a.stage_name AS artist_name,
  a.profile_image AS artist_image,
  u.id         AS artist_user_id,
  al.id        AS album_id,
  al.title     AS album_title,
  al.cover_image AS album_cover,
  g.id         AS genre_id,
  g.name       AS genre_name,
  g.color      AS genre_color
FROM songs s
JOIN artist_profiles a ON s.artist_id = a.id
JOIN users u           ON a.user_id   = u.id
LEFT JOIN albums al    ON s.album_id  = al.id
LEFT JOIN genres g     ON s.genre_id  = g.id
WHERE s.deleted_at IS NULL;
