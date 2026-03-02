const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTables() {
  console.log('Creating Memoria tables...');

  // 1. Create memoria_indexes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memoria_indexes (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✓ memoria_indexes created');

  // 2. Create memoria_subindexes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memoria_subindexes (
      id BIGSERIAL PRIMARY KEY,
      memoria_index_id BIGINT NOT NULL REFERENCES memoria_indexes(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      name TEXT,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (memoria_index_id, key)
    );
  `);
  console.log('✓ memoria_subindexes created');

  // 3. Create memoria_threads table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memoria_threads (
      id BIGSERIAL PRIMARY KEY,
      external_id TEXT NOT NULL UNIQUE,
      memoria_index_id BIGINT REFERENCES memoria_indexes(id) ON DELETE SET NULL,
      memoria_subindex_id BIGINT REFERENCES memoria_subindexes(id) ON DELETE SET NULL,
      app_source TEXT NOT NULL DEFAULT 'builder',
      title TEXT,
      context TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_turn_at TIMESTAMP WITH TIME ZONE
    );
  `);
  console.log('✓ memoria_threads created');

  // 4. Create memoria_turns table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memoria_turns (
      id BIGSERIAL PRIMARY KEY,
      thread_id BIGINT NOT NULL REFERENCES memoria_threads(id) ON DELETE CASCADE,
      external_turn_id TEXT,
      turn_index INTEGER NOT NULL,
      user_text TEXT,
      assistant_response TEXT,
      assistant_thinking_summary TEXT,
      assistant_synthesis TEXT,
      code_summary TEXT,
      raw_messages JSONB,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (thread_id, turn_index),
      UNIQUE (thread_id, external_turn_id)
    );
  `);
  console.log('✓ memoria_turns created');

  // 5. Create performance indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_threads_source ON memoria_threads (app_source);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_threads_updated_at ON memoria_threads (updated_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_threads_last_turn_at ON memoria_threads (last_turn_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_threads_index_subindex ON memoria_threads (memoria_index_id, memoria_subindex_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_turns_thread_created_at ON memoria_turns (thread_id, created_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_turns_external_turn_id ON memoria_turns (external_turn_id) WHERE (external_turn_id IS NOT NULL);
  `);
  console.log('✓ Performance indexes created');

  // 6. Create full-text search index on turns
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memoria_turns_search ON memoria_turns
    USING gin (to_tsvector('english',
      (COALESCE(user_text,'') || ' ' ||
       COALESCE(assistant_response,'') || ' ' ||
       COALESCE(assistant_synthesis,'') || ' ' ||
       COALESCE(code_summary,''))
    ));
  `);
  console.log('✓ Full-text search index created');

  await pool.end();
  console.log('\nDone! Memoria tables ready.');
}

createTables().catch(err => {
  console.error('Error creating tables:', err);
  process.exit(1);
});
