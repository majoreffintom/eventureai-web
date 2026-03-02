import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function inspectDatabase() {
  const sql = getSQL();
  
  try {
    console.log('--- Database Inspection (Hardcoded Table Names) ---');
    
    // Check memories
    try {
      const res = await sql`SELECT COUNT(*) as count, MAX(id) as last_id FROM memories`;
      console.log(`memories            | Count: ${res[0].count.toString().padEnd(10)} | Last ID: ${res[0].last_id}`);
    } catch (e: any) { console.log(`memories: ${e.message}`); }

    // Check rosebud_media_assets
    try {
      const res = await sql`SELECT COUNT(*) as count, MAX(id) as last_id FROM rosebud_media_assets`;
      console.log(`rosebud_media_assets| Count: ${res[0].count.toString().padEnd(10)} | Last ID: ${res[0].last_id}`);
    } catch (e: any) { console.log(`rosebud_media_assets: ${e.message}`); }

    // Check app_pages
    try {
      const res = await sql`SELECT COUNT(*) as count, MAX(id) as last_id FROM app_pages`;
      console.log(`app_pages           | Count: ${res[0].count.toString().padEnd(10)} | Last ID: ${res[0].last_id}`);
    } catch (e: any) { console.log(`app_pages: ${e.message}`); }

    // Check builder_messages
    try {
      const res = await sql`SELECT COUNT(*) as count, MAX(id) as last_id FROM builder_messages`;
      console.log(`builder_messages    | Count: ${res[0].count.toString().padEnd(10)} | Last ID: ${res[0].last_id}`);
    } catch (e: any) { console.log(`builder_messages: ${e.message}`); }

  } catch (error) {
    console.error('❌ Inspection failed:', error);
  }
}

inspectDatabase();