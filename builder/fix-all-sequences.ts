import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function fixAllSequences() {
  const sql = getSQL();
  console.log("🛠️ Aligning Primary Key Sequences...");

  // mori_error_chains
  try {
    const res = await sql`SELECT COUNT(*) as count FROM mori_error_chains`;
    if (res[0].count === '0') {
      await sql`ALTER SEQUENCE mori_error_chains_id_seq RESTART WITH 1`;
      console.log(`✅ mori_error_chains: Restarted at 1`);
    }
  } catch (e: any) { console.log(`❌ mori_error_chains: ${e.message}`); }

  // mori_solutions
  try {
    const res = await sql`SELECT COUNT(*) as count FROM mori_solutions`;
    if (res[0].count === '0') {
      await sql`ALTER SEQUENCE mori_solutions_id_seq RESTART WITH 1`;
      console.log(`✅ mori_solutions: Restarted at 1`);
    }
  } catch (e: any) { console.log(`❌ mori_solutions: ${e.message}`); }

  // builder_conversations
  try {
    const res = await sql`SELECT COUNT(*) as count FROM builder_conversations`;
    if (res[0].count === '0') {
      await sql`ALTER SEQUENCE builder_conversations_id_seq RESTART WITH 1`;
      console.log(`✅ builder_conversations: Restarted at 1`);
    }
  } catch (e: any) { console.log(`❌ builder_conversations: ${e.message}`); }

  // builder_messages
  try {
    const res = await sql`SELECT COUNT(*) as count FROM builder_messages`;
    if (res[0].count === '0') {
      await sql`ALTER SEQUENCE builder_messages_id_seq RESTART WITH 1`;
      console.log(`✅ builder_messages: Restarted at 1`);
    }
  } catch (e: any) { console.log(`❌ builder_messages: ${e.message}`); }
}

fixAllSequences();