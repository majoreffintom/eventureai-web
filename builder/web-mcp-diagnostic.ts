import 'dotenv/config';
import { mcpTools } from './packages/llm/dist/tools/builtin/mcp.js';
import { getSQL } from './packages/llm/dist/index.js';
import Anthropic from '@anthropic-ai/sdk';

async function runWebMCPDiagnostic() {
  console.log("🛠️ Starting WebMCP Comprehensive Diagnostic...");
  const sql = getSQL();
  const ctx = { context: { sql } };

  // 1. Diagnose System Health
  console.log("\n1️⃣ Checking System Health Tool...");
  try {
    const health = await mcpTools.diagnoseSystem.execute({}, ctx as any);
    console.log("Result:", JSON.stringify(health.data, null, 2));
  } catch (e: any) {
    console.error("❌ System Health Tool failed:", e.message);
  }

  // 2. Test LLM Direct Connectivity
  console.log("\n2️⃣ Testing Anthropic SDK Direct Connectivity...");
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const start = Date.now();
    const msg = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }]
    });
    console.log(`✅ Anthropic responded in ${Date.now() - start}ms:`, msg.content[0].type === 'text' ? msg.content[0].text : 'non-text');
  } catch (e: any) {
    console.error("❌ Anthropic SDK failed:", e.message);
  }

  // 3. Test Web Research (Jina Reader)
  console.log("\n3️⃣ Testing Web Research (Jina Reader) for rosebudveneer.com...");
  try {
    const start = Date.now();
    const research = await mcpTools.webResearch.execute({ url: "https://rosebudveneer.com" }, ctx as any);
    if (research.error) {
      console.error("❌ Research Tool error:", research.error);
    } else {
      console.log(`✅ Jina Reader responded in ${Date.now() - start}ms.`);
      console.log(`   Provider: ${research.provider}`);
      console.log(`   Content Length: ${research.content?.length || 0} chars`);
      console.log(`   Snippet: ${research.content?.substring(0, 100)}...`);
    }
  } catch (e: any) {
    console.error("❌ Research Tool failed:", e.message);
  }

  // 4. Test Google Search
  console.log("\n4️⃣ Testing Google Search Tool...");
  try {
    const search = await mcpTools.googleSearch.execute({ query: "Rosebud Veneer products" }, ctx as any);
    if (search.error) {
      console.error("❌ Google Search error:", search.error);
    } else {
      console.log("✅ Google Search successful.");
      console.log(`   Results found: ${search.results?.length || 0}`);
    }
  } catch (e: any) {
    console.error("❌ Google Search Tool failed:", e.message);
  }

  console.log("\n🏁 Diagnostic Finished.");
}

runWebMCPDiagnostic();