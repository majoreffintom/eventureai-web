import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findPersonaInfo() {
  const sql = getSQL();
  console.log("🔍 Searching 1,141 records for persona details...");

  try {
    // Search for keywords related to nickname or favorite agent
    const results = await sql`
      SELECT id, content, tags
      FROM memories
      WHERE content ILIKE '%nick-name%' 
         OR content ILIKE '%nickname%' 
         OR content ILIKE '%favorite agent%'
         OR content ILIKE '%favourite agent%'
      ORDER BY id DESC
    `;

    if (results.length === 0) {
      console.log("No explicit mentions found. Fetching recent history for context...");
      const recent = await sql`
        SELECT id, content 
        FROM memories 
        ORDER BY id DESC 
        LIMIT 50
      `;
      console.log("--- Recent Context ---");
      recent.forEach((r: any) => console.log(`[${r.id}] ${r.content.substring(0, 200)}...`));
    } else {
      console.log(`✅ Found ${results.length} matching records:`);
      results.forEach((r: any) => {
        console.log(`
--- Record ${r.id} ---`);
        console.log(r.content);
      });
    }
  } catch (error: any) {
    console.error("❌ Search failed:", error.message);
  }
}

findPersonaInfo();