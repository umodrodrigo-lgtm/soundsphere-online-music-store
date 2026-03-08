-- ============================================================
-- SoundSphere - Seed Data
-- ============================================================
USE soundsphere;

-- Roles
INSERT IGNORE INTO roles (id, name) VALUES
  (1, 'admin'),
  (2, 'artist'),
  (3, 'customer');

-- Genres
INSERT IGNORE INTO genres (name, slug, color, icon) VALUES
  ('Pop',           'pop',           '#f43f5e', '🎵'),
  ('Hip-Hop',       'hip-hop',       '#8b5cf6', '🎤'),
  ('R&B',           'rnb',           '#ec4899', '🎼'),
  ('Electronic',    'electronic',    '#06b6d4', '🎧'),
  ('Rock',          'rock',          '#ef4444', '🎸'),
  ('Jazz',          'jazz',          '#f59e0b', '🎷'),
  ('Classical',     'classical',     '#6366f1', '🎻'),
  ('Country',       'country',       '#84cc16', '🤠'),
  ('Reggae',        'reggae',        '#10b981', '🌴'),
  ('Soul',          'soul',          '#f97316', '💫'),
  ('Latin',         'latin',         '#fb923c', '💃'),
  ('K-Pop',         'k-pop',         '#a855f7', '✨'),
  ('Afrobeats',     'afrobeats',     '#fbbf24', '🥁'),
  ('Indie',         'indie',         '#64748b', '🎙️'),
  ('Blues',         'blues',         '#3b82f6', '🎺');

-- Subscription Plans
INSERT IGNORE INTO subscription_plans (name, slug, price, billing_cycle, max_accounts, has_ads, is_premium, audio_quality, features) VALUES
  ('Free', 'free', 0.00, 'monthly', 1, TRUE, FALSE, 'standard',
   '["Limited skips per hour","Standard audio quality","Ad-supported","Access to trending songs"]'),
  ('Premium', 'premium', 9.99, 'monthly', 1, FALSE, TRUE, 'high',
   '["Unlimited skips","High quality audio","No ads","Offline downloads","Full song access","Exclusive content"]'),
  ('Premium Yearly', 'premium-yearly', 99.99, 'yearly', 1, FALSE, TRUE, 'lossless',
   '["All Premium features","Lossless audio quality","2 months free","Priority support","Early access to new features"]'),
  ('Family', 'family', 14.99, 'monthly', 6, FALSE, TRUE, 'high',
   '["Up to 6 accounts","High quality audio","No ads","Offline downloads","Family mix playlist","Individual recommendations"]');

-- Users are inserted by seed.js with bcryptjs-generated password hashes.

-- Artist profiles
INSERT IGNORE INTO artist_profiles (id, user_id, stage_name, profile_image, cover_image, bio, genre_id, country, monthly_listeners, total_plays, is_verified, is_approved) VALUES
  ('ap-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'Aria Nova',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop',
   'https://images.unsplash.com/photo-1501386761578-eaa54b292f16?w=1200&h=400&fit=crop',
   'Aria Nova is a Grammy-nominated pop artist known for her powerful vocals and anthemic songwriting. With multiple platinum records under her belt, she continues to push the boundaries of pop music.',
   1, 'United States', 2400000, 45000000, TRUE, TRUE),
  ('ap-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   'Marcus Vibe',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
   'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&h=400&fit=crop',
   'Marcus Vibe is an Atlanta-based rapper and producer who blends trap beats with conscious lyrics. His debut album went gold in its first week.',
   2, 'United States', 1800000, 32000000, TRUE, TRUE),
  ('ap-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000004',
   'Luna Echo',
   'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=400&fit=crop',
   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
   'Luna Echo is a Berlin-based electronic music producer whose hypnotic soundscapes have taken the global club scene by storm.',
   4, 'Germany', 950000, 18000000, FALSE, TRUE),
  ('ap-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000005',
   'Rhythm & Soul',
   'https://images.unsplash.com/photo-1467238307722-a6e8b4bea46c?w=400&h=400&fit=crop',
   'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop',
   'Rhythm & Soul brings raw emotion and soulful melodies that speak to the heart. Influenced by classic R&B legends.',
   3, 'United Kingdom', 620000, 9500000, FALSE, TRUE);

-- Albums
INSERT IGNORE INTO albums (id, artist_id, title, cover_image, genre_id, release_date, album_type, is_published) VALUES
  ('alb-000-0000-0000-000000000001',
   'ap-0000-0000-0000-000000000002',
   'Neon Dreams',
   'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400&h=400&fit=crop',
   1, '2024-01-15', 'album', TRUE),
  ('alb-000-0000-0000-000000000002',
   'ap-0000-0000-0000-000000000003',
   'Street Chronicles',
   'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
   2, '2024-03-20', 'album', TRUE),
  ('alb-000-0000-0000-000000000003',
   'ap-0000-0000-0000-000000000004',
   'Deep Frequencies',
   'https://images.unsplash.com/photo-1501386761578-eaa54b292f16?w=400&h=400&fit=crop',
   4, '2024-02-10', 'ep', TRUE),
  ('alb-000-0000-0000-000000000004',
   'ap-0000-0000-0000-000000000005',
   'Heartstrings',
   'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
   3, '2024-04-05', 'album', TRUE);

-- Songs (using placeholder audio via picsum image equivalent for covers)
INSERT IGNORE INTO songs (id, artist_id, album_id, genre_id, title, slug, duration, audio_url, cover_image, release_date, play_count, like_count, is_premium, status) VALUES
  ('sng-000-0000-0000-000000000001',
   'ap-0000-0000-0000-000000000002',
   'alb-000-0000-0000-000000000001',
   1, 'Electric Sky', 'electric-sky',
   214, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400&h=400&fit=crop',
   '2024-01-15', 1245000, 84000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000002',
   'ap-0000-0000-0000-000000000002',
   'alb-000-0000-0000-000000000001',
   1, 'Midnight Glow', 'midnight-glow',
   198, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=400&fit=crop',
   '2024-01-20', 980000, 62000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000003',
   'ap-0000-0000-0000-000000000002',
   'alb-000-0000-0000-000000000001',
   1, 'Starfall', 'starfall',
   225, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
   '2024-02-01', 756000, 48000, TRUE, 'approved'),
  ('sng-000-0000-0000-000000000004',
   'ap-0000-0000-0000-000000000003',
   'alb-000-0000-0000-000000000002',
   2, 'Street Life', 'street-life',
   187, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
   '2024-03-20', 1100000, 75000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000005',
   'ap-0000-0000-0000-000000000003',
   'alb-000-0000-0000-000000000002',
   2, 'Real Talk', 'real-talk',
   201, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
   '2024-03-25', 890000, 59000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000006',
   'ap-0000-0000-0000-000000000004',
   'alb-000-0000-0000-000000000003',
   4, 'Pulse', 'pulse',
   336, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
   '2024-02-10', 670000, 43000, TRUE, 'approved'),
  ('sng-000-0000-0000-000000000007',
   'ap-0000-0000-0000-000000000004',
   'alb-000-0000-0000-000000000003',
   4, 'Neon Nights', 'neon-nights',
   298, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=400&fit=crop',
   '2024-02-15', 540000, 36000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000008',
   'ap-0000-0000-0000-000000000005',
   'alb-000-0000-0000-000000000004',
   3, 'Love Letter', 'love-letter',
   245, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
   '2024-04-05', 430000, 28000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000009',
   'ap-0000-0000-0000-000000000005',
   'alb-000-0000-0000-000000000004',
   3, 'Broken Wings', 'broken-wings',
   262, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1467238307722-a6e8b4bea46c?w=400&h=400&fit=crop',
   '2024-04-10', 380000, 24000, FALSE, 'approved'),
  ('sng-000-0000-0000-000000000010',
   'ap-0000-0000-0000-000000000002',
   NULL,
   1, 'Golden Hour', 'golden-hour',
   189, '/uploads/audio/sample.mp3',
   'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=400&fit=crop',
   '2024-05-01', 1500000, 95000, FALSE, 'approved');

-- Banners
INSERT IGNORE INTO banners (title, subtitle, image_url, link_url, position, is_active) VALUES
  ('Discover New Music', 'Stream millions of songs from your favorite artists', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&h=600&fit=crop', '/browse', 0, TRUE),
  ('Aria Nova - Neon Dreams', 'The new album from the pop sensation is here', 'https://images.unsplash.com/photo-1501386761578-eaa54b292f16?w=1400&h=600&fit=crop', '/albums/alb-000-0000-0000-000000000001', 1, TRUE),
  ('Premium Membership', 'Go Premium for unlimited access and no ads', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&h=600&fit=crop', '/subscription', 2, TRUE);

-- Sample subscriptions
INSERT IGNORE INTO subscriptions (id, user_id, plan_id, status, started_at, expires_at, auto_renew) VALUES
  ('sub-000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000006',
   2, 'active', '2024-01-01', '2025-01-01', TRUE),
  ('sub-000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000007',
   1, 'active', '2024-03-01', NULL, FALSE);

-- Sample favorites / likes
INSERT IGNORE INTO song_likes (user_id, song_id) VALUES
  ('00000000-0000-0000-0000-000000000006', 'sng-000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000006', 'sng-000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000006', 'sng-000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000007', 'sng-000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000007', 'sng-000-0000-0000-000000000006');

-- Sample playlist
INSERT IGNORE INTO playlists (id, user_id, title, description, is_public) VALUES
  ('pl--000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000006',
   'My Favorites Mix', 'A collection of my top songs', TRUE),
  ('pl--000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000007',
   'Late Night Vibes', 'Perfect for late night sessions', TRUE);

INSERT IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES
  ('pl--000-0000-0000-000000000001', 'sng-000-0000-0000-000000000001', 1),
  ('pl--000-0000-0000-000000000001', 'sng-000-0000-0000-000000000004', 2),
  ('pl--000-0000-0000-000000000001', 'sng-000-0000-0000-000000000010', 3),
  ('pl--000-0000-0000-000000000002', 'sng-000-0000-0000-000000000006', 1),
  ('pl--000-0000-0000-000000000002', 'sng-000-0000-0000-000000000007', 2);

-- Listening history samples
INSERT IGNORE INTO listening_history (user_id, song_id, duration_s) VALUES
  ('00000000-0000-0000-0000-000000000006', 'sng-000-0000-0000-000000000001', 214),
  ('00000000-0000-0000-0000-000000000006', 'sng-000-0000-0000-000000000004', 187),
  ('00000000-0000-0000-0000-000000000007', 'sng-000-0000-0000-000000000002', 198);
