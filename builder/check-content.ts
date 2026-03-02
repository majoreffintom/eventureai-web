import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkContent() {
  const sql = getSQL();
  try {
    const res = await sql`SELECT app_id, slug, (content IS NOT NULL) as has_content, jsonb_array_length(CASE WHEN jsonb_typeof(content) = 'array' THEN content ELSE '[]'::jsonb END) as len FROM app_pages`;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
checkContent();