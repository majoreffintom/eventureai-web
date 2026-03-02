import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findUserFav() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT id, content 
      FROM memories 
      WHERE id <= 1141 AND (content ILIKE '%favorite%' OR content ILIKE '%favourite%')
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
findUserFav();