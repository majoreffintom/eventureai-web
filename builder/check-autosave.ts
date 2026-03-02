import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkRecentInteractions() {
  const sql = getSQL();
  console.log('🔍 Checking for new autosaved interactions...');

  try {
    const results = await sql`
      SELECT id, title, memory_type, tags, created_at
      FROM memories 
      WHERE memory_type IN ('user_interaction', 'assistant_interaction', 'session_summary')
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    if (results.length === 0) {
      console.log('∅ No interactions found yet.');
    } else {
      console.table(results);
    }
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  }
}

checkRecentInteractions();
