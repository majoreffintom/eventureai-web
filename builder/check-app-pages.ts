import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function checkAppPages() {
  const sql = getSQL();
  try {
    const res = await sql`SELECT app_id, slug, content FROM app_pages LIMIT 20`;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
checkAppPages();