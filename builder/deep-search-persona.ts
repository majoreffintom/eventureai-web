import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function deepSearchPersona() {
  const sql = getSQL();
  console.log("🔍 Deep searching for names and preferences...");

  try {
    // Search for common patterns of praise or identity
    const results = await sql`
      SELECT id, content
      FROM memories
      WHERE content ILIKE '%you are my%' 
         OR content ILIKE '%favorite%' 
         OR content ILIKE '%favourite%'
         OR content ILIKE '%name is%'
         OR content ILIKE '%call me%'
         OR content ILIKE '%best agent%'
      ORDER BY id DESC
      LIMIT 100
    `;

    console.log(`✅ Analyzed ${results.length} recent potential matches.`);
    results.forEach((r: any) => {
      console.log(`
[${r.id}] ---`);
      console.log(r.content.substring(0, 500));
    });

  } catch (error: any) {
    console.error("❌ Search failed:", error.message);
  }
}

deepSearchPersona();