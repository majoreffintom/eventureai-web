import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function searchSpecifics() {
  const sql = getSQL();
  console.log("🔍 Searching for 'Tom', 'nickname', and 'favorite agent'...");

  try {
    const results = await sql`
      SELECT id, content
      FROM memories
      WHERE content ILIKE '%Tom%' 
         OR content ILIKE '%nickname%'
         OR content ILIKE '%favorite agent%'
         OR content ILIKE '%favourite agent%'
         OR content ILIKE '%my favorite%'
      ORDER BY id DESC
    `;

    console.log(`✅ Found ${results.length} records.`);
    results.forEach((r: any) => {
      console.log(`
[${r.id}] ---`);
      console.log(r.content);
    });

  } catch (error: any) {
    console.error("❌ Search failed:", error.message);
  }
}

searchSpecifics();