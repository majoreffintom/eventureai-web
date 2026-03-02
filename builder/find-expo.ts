import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findExpo() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT id, title, content 
      FROM memories 
      WHERE content ILIKE '%expo%' OR title ILIKE '%expo%'
      ORDER BY id DESC
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
findExpo();