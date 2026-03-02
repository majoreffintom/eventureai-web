import 'dotenv/config';
import { mcpTools } from './packages/llm/dist/tools/builtin/mcp.js';
import { getSQL } from './packages/llm/dist/index.js';

async function runContinuousAudit() {
  const sql = getSQL();
  const targets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  
  console.log("👁️ VISION AUDITOR STARTED. Monitoring 11 tenants...");

  while (true) {
    for (const id of targets) {
      try {
        const url = `http://localhost:3000/preview?appId=${id}&env=live`;
        
        // 1. Visual Capture
        const res = await mcpTools.captureScreenshot.execute({ url }, {});
        if (res.error) {
          console.error(`🚨 [#${id}] Visual Audit Failed: ${res.error}`);
        } else {
          console.log(`✅ [#${id}] Visual Audit OK.`);
        }

        // 2. Error Log Check
        const errs = await mcpTools.getLiveErrors.execute({ limit: 1 }, { context: { sql } } as any);
        if (errs.errors?.length > 0) {
          console.log(`🚨 [#${id}] CRASH DETECTED in logs.`);
        }

      } catch (e: any) {
        console.error(`⚠️ [#${id}] Audit Loop Error: ${e.message}`);
      }
      
      // Throttle to avoid overloading local server
      await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log("🔄 Full Sweep Complete. Restarting...");
    await new Promise(r => setTimeout(r, 30000)); // Pause between full sweeps
  }
}

runContinuousAudit();