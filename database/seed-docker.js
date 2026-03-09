// Seed script for running INSIDE the backend Docker container
// Usage: docker compose exec backend node /database/seed-docker.js

const fs     = require('fs');
const path   = require('path');
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding SoundSphere database...\n');

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'db',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'soundsphere',
    multipleStatements: true,
  });

  try {
    // Run static SQL (genres, plans, artist profiles, albums, songs, etc.)
    const sql = fs.readFileSync('/database/seed.sql', 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim())
      .filter(s => s.length > 0 && !s.toUpperCase().startsWith('USE'));

    for (const stmt of statements) {
      try {
        await conn.execute(stmt);
      } catch (err) {
        if (!err.message.includes('Duplicate')) {
          console.warn('  ⚠️  Warning:', err.message.slice(0, 80));
        }
      }
    }

    // Hash passwords with bcryptjs
    console.log('  Hashing passwords...');
    const COST = 12;
    const hashAdmin    = await bcrypt.hash('Admin@123', COST);
    const hashPassword = await bcrypt.hash('password',  COST);

    // Admin
    await conn.execute(
      `INSERT INTO users (id, role_id, email, password_hash, username, display_name, bio, is_active, email_verified)
       VALUES (?, 1, ?, ?, 'admin', 'SoundSphere Admin', 'Platform administrator', TRUE, TRUE)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['00000000-0000-0000-0000-000000000001', 'admin@soundsphere.com', hashAdmin]
    );

    // Artists (password: password)
    const artists = [
      ['00000000-0000-0000-0000-000000000002', 'aria.nova@example.com',   'aria_nova',   'Aria Nova',     'Award-winning pop artist from Los Angeles.'],
      ['00000000-0000-0000-0000-000000000003', 'marcus.vibe@example.com', 'marcus_vibe', 'Marcus Vibe',   'Hip-hop producer and rapper from Atlanta.'],
      ['00000000-0000-0000-0000-000000000004', 'luna.echo@example.com',   'luna_echo',   'Luna Echo',     'Electronic music producer and DJ.'],
      ['00000000-0000-0000-0000-000000000005', 'rhythm.soul@example.com', 'rhythm_soul', 'Rhythm & Soul', 'R&B and soul vocalist bringing heartfelt music.'],
    ];
    for (const [id, email, username, display_name, bio] of artists) {
      await conn.execute(
        `INSERT INTO users (id, role_id, email, password_hash, username, display_name, bio, is_active, email_verified)
         VALUES (?, 2, ?, ?, ?, ?, ?, TRUE, TRUE)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [id, email, hashPassword, username, display_name, bio]
      );
    }

    // Customers (password: password)
    const customers = [
      ['00000000-0000-0000-0000-000000000006', 'john.doe@example.com',   'john_doe',   'John Doe'],
      ['00000000-0000-0000-0000-000000000007', 'jane.smith@example.com', 'jane_smith', 'Jane Smith'],
    ];
    for (const [id, email, username, display_name] of customers) {
      await conn.execute(
        `INSERT INTO users (id, role_id, email, password_hash, username, display_name, is_active, email_verified)
         VALUES (?, 3, ?, ?, ?, ?, TRUE, TRUE)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [id, email, hashPassword, username, display_name]
      );
    }

    console.log('✅ Seed complete!\n');
    console.log('  Admin:    admin@soundsphere.com  / Admin@123');
    console.log('  Artist:   aria.nova@example.com  / password');
    console.log('  Customer: john.doe@example.com   / password\n');
  } finally {
    await conn.end();
  }
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
