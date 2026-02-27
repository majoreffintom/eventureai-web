/**
 * Test script for Mori Gateway integration
 *
 * Usage:
 *   MORI_API_KEY=mori_sk_eventureai_OBRZaigcPcxuR1I0JwdyEBMP0q_vJzut npx tsx test-gateway.ts
 */

import { createMoriGateway } from "./packages/llm/src/gateway/index.js";

async function main() {
  const apiKey = process.env.MORI_API_KEY;

  if (!apiKey) {
    console.error("Error: MORI_API_KEY environment variable not set");
    console.error("");
    console.error("Usage:");
    console.error("  MORI_API_KEY=mori_sk_eventureai_xxx npx tsx test-gateway.ts");
    process.exit(1);
  }

  console.log("🧪 Testing Mori Gateway Integration\n");
  console.log(`API Key: ${apiKey.slice(0, 20)}...${apiKey.slice(-10)}`);

  const gateway = createMoriGateway({
    apiKey,
    baseUrl: process.env.MORI_GATEWAY_URL || "https://mori.com/api/llm",
  });

  console.log(`Tenant: ${gateway.getTenantSlug()}\n`);

  try {
    // Test 1: Simple ask
    console.log("📝 Test 1: Simple ask (non-streaming)");
    console.log("Question: What is 2+2?");

    const answer = await gateway.ask("What is 2+2? Answer with just the number.");
    console.log(`Answer: ${answer}\n`);

    // Test 2: Streaming ask
    console.log("📝 Test 2: Streaming ask");
    console.log("Question: Name 3 programming languages");

    let streamedText = "";
    const response = await gateway.askStream(
      "Name 3 programming languages. Be brief.",
      (text) => {
        process.stdout.write(text);
        streamedText += text;
      }
    );
    console.log("\n\nStream complete!\n");

    // Test 3: Chat with context
    console.log("📝 Test 3: Chat with context");
    const chatResponse = await gateway.chat({
      messages: [
        { role: "system", content: "You are a helpful coding assistant." },
        { role: "user", content: "What is TypeScript?" },
      ],
      max_tokens: 100,
    });

    console.log(`Model: ${chatResponse.model}`);
    console.log(`Response: ${chatResponse.content.slice(0, 200)}...`);
    console.log(`Usage: ${chatResponse.usage.input_tokens} in / ${chatResponse.usage.output_tokens} out\n`);

    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
