import 'dotenv/config';
import { getSQL, createMemory } from './packages/llm/dist/index.js';

async function saveManifesto() {
  const sql = getSQL();
  try {
    const memory = await createMemory(sql, {
      title: "The Manifesto of the 10,001st Hour",
      content: "The user (Tom, Cosmic Wrangler) envisions a future where MCP allows dev/live to work autonomously to the end. Utilizing 'dangerously-skip-permissions', the AI will build, debug, and troubleshoot after the build, entirely autonomously. This marks the shift from declarative vibe-coding to imperative live engineering.",
      memoryType: "system_directive",
      tags: ["manifesto", "autonomous-build", "mcp"],
      domain: "core-philosophy"
    });
    console.log(`✅ Manifesto saved to memory! ID: ${memory.id}`);
  } catch (error: any) {
    console.error("❌ Failed to save manifesto:", error.message);
  }
}
saveManifesto();