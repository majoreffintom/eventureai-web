import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function getNextId() {
  const sql = getSQL();
  
  try {
    const result = await sql`
      SELECT id
      FROM memories
      ORDER BY id DESC
      LIMIT 1
    `;

    console.log('Raw result:', result);

    if (result.length === 0) {
      console.log('Next ID: 1 (Table is empty)');
    } else {
      const lastId = (result[0] as any).id;
      console.log(`Last ID: ${lastId}`);
      console.log(`Next ID: ${lastId + 1}`);
    }
  } catch (error) {
    console.error('❌ Query failed:');
    console.error(error);
  }
}

getNextId();