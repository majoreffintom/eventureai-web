const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTables() {
  console.log('Creating builder conversation tables...');

  // Create builder_conversations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS builder_conversations (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER,
      workspace_id BIGINT,
      agent VARCHAR(50) NOT NULL DEFAULT 'build',
      title TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✓ builder_conversations created');

  // Create builder_messages table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS builder_messages (
      id BIGSERIAL PRIMARY KEY,
      conversation_id BIGINT REFERENCES builder_conversations(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      tokens_used INTEGER,
      model VARCHAR(100),
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✓ builder_messages created');

  // Create index for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_builder_messages_conversation
    ON builder_messages(conversation_id, created_at);
  `);
  console.log('✓ Indexes created');

  await pool.end();
  console.log('\nDone! Builder conversation tables ready.');
}

createTables();
