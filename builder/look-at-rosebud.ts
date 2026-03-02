import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function lookAtRosebud() {
  const sql = getSQL();
  try {
    console.log("📜 Retrieving Live Component Tree for Rosebud...");
    
    // Check both potential locations
    const res9 = await sql`SELECT content FROM app_pages WHERE app_id = 9 AND slug = 'index' LIMIT 1`;
    const res1 = await sql`SELECT content FROM app_pages WHERE app_id = 1 AND slug = 'index' LIMIT 1`;

    const content = res9.length > 0 ? res9[0].content : (res1.length > 0 ? res1[0].content : null);

    if (!content) {
      console.log("No content found for Rosebud.");
    } else {
      console.log("\n--- ROSEBUD MASTERPIECE STRUCTURE ---");
      console.log(JSON.stringify(content, null, 2));
    }

  } catch (e: any) {
    console.error("❌ Error:", e.message);
  }
}
lookAtRosebud();