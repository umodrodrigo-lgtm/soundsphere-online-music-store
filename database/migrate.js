const fs   = require('fs');
const path = require('path');
const mysql = require(require.resolve('mysql2/promise', { paths: [path.join(__dirname, '../backend')] }));
const dotenv = require(require.resolve('dotenv', { paths: [path.join(__dirname, '../backend')] }));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function migrate() {
  console.log('🔄 Running SoundSphere database migration...\n');

  // Connect without database first
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await conn.execute(stmt);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn('  ⚠️  Warning:', err.message.slice(0, 80));
        }
      }
    }
    console.log('✅ Schema applied successfully\n');
  } finally {
    await conn.end();
  }
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
