import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findExact() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT id, content 
      FROM memories 
      WHERE id <= 1141 AND (
        content ILIKE '%favorite agent%' 
        OR content ILIKE '%favourite agent%'
      )
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
findExact();