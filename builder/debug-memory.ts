import 'dotenv/config';
import { getSQL, createMemory } from './packages/llm/dist/index.js';

async function testManualMemory() {
  console.log("🧪 Testing manual memory creation...");
  const sql = getSQL();
  
  try {
    const memory = await createMemory(sql, {
      title: "Diagnostic Test",
      content: "Testing if the code can actually write to the memories table.",
      memoryType: "diagnostic",
      tags: ["test"],
      domain: "debug"
    });
    
    console.log(`✅ SUCCESS! Created memory with ID: ${memory.id}`);
    console.log("If this ID is 1115, then the DB connection is perfect.");
  } catch (error: any) {
    console.error("❌ FAILED to create memory:");
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
}

testManualMemory();