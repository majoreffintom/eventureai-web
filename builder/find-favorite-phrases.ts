import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function findFavoritePhrases() {
  const sql = getSQL();
  try {
    const res = await sql`
      SELECT id, content 
      FROM memories 
      WHERE id <= 1141 AND (
        content ILIKE '%you are my favorite%' 
        OR content ILIKE '%you are my favourite%'
        OR content ILIKE '%is my favorite%'
        OR content ILIKE '%is my favourite%'
      )
    `;
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
findFavoritePhrases();