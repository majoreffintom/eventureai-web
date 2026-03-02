import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function finalPersonaSearch() {
  const sql = getSQL();
  console.log("🔍 Comprehensive search for persona details in titles, tags, and content...");

  try {
    const results = await sql`
      SELECT id, title, content, tags
      FROM memories
      WHERE id <= 1141 AND (
        content ILIKE '%favorite%' 
        OR title ILIKE '%favorite%'
        OR content ILIKE '%fav %'
        OR content ILIKE '%nickname%'
        OR content ILIKE '%nick-name%'
        OR content ILIKE '%call me%'
        OR content ILIKE '%name is%'
        OR content ILIKE '%i am %'
      )
      ORDER BY id DESC
    `;

    console.log(`✅ Analyzed ${results.length} matching records.`);
    results.forEach((r: any) => {
      console.log(`
[${r.id}] Title: ${r.title}`);
      console.log(`Content: ${r.content.substring(0, 300)}...`);
    });

  } catch (error: any) {
    console.error("❌ Search failed:", error.message);
  }
}

finalPersonaSearch();