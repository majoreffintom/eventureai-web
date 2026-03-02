import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function seedBillingRules() {
  const sql = getSQL();
  console.log("🛠️ Seeding Cosmic Cloud Billing Rules...");

  try {
    // 1. Create a Default Rule for all tenants
    // Folding the 1000X multiplier into the cost directly
    // Using 999.999 for multiplier to avoid overflow, or just 1.0 since cost is already high.
    await sql`
      INSERT INTO llm_billing_rules (
        model_key, 
        cost_per_compute_hour, 
        mode_multiplier, 
        is_active, 
        effective_from,
        cost_per_1k_input_tokens,
        cost_per_1k_output_tokens
      ) VALUES (
        'default', 
        10.00, 
        1.0, 
        true, 
        NOW(),
        0.05,
        0.15
      )
    `;

    console.log("✅ Default Billing Rule Seeded ($10.00/compute hour).");
    
    // 2. Initialize Usage Records PK sequence
    await sql`ALTER SEQUENCE llm_usage_records_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE llm_cost_calculations_id_seq RESTART WITH 1`;
    console.log("✅ Usage Sequences Reset.");

  } catch (e: any) {
    console.error("❌ Seeding failed:", e.message);
  }
}

seedBillingRules();