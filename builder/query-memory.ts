import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function queryMemoryById(id: number) {
  const sql = getSQL();
  
  console.log(`🔍 Querying memory with ID: ${id}...`);

  try {
    const result = await sql`
      SELECT * 
      FROM memories 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      console.log(`❌ No memory found with ID: ${id}`);
    } else {
      console.log('✅ Memory found:');
      console.dir(result[0], { depth: null });
    }
  } catch (error) {
    console.error('❌ Query failed:');
    console.error(error);
  }
}

// Get ID from command line or default to 10
const targetId = parseInt(process.argv[2] || '10', 10);
queryMemoryById(targetId);
