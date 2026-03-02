import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function fixSequence() {
  console.log("🛠️ Fixing primary key sequence for 'memories' table...");
  const sql = getSQL();
  
  try {
    const result = await sql`SELECT setval('memories_id_seq', (SELECT MAX(id) FROM memories))`;
    console.log("✅ Sequence fixed! Next ID will be:", (result[0] as any).setval + 1);
    
    console.log("🧪 Verifying with a test insert...");
    const [test] = await sql`
      INSERT INTO memories (title, content, memory_type) 
      VALUES ('Sequence Fix Test', 'Verifying if sequence is now correct.', 'diagnostic')
      RETURNING id
    `;
    console.log(`🚀 SUCCESS! Test record created with ID: ${test.id}`);
  } catch (error: any) {
    console.error("❌ Fix failed:");
    console.error(error.message);
  }
}

fixSequence();