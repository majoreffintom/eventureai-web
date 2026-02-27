// Token Usage Logger - Records LLM usage to database for cost accounting
import sql from '../db';
import type { TokenUsageRecord } from './token-tracker';

// Log token usage to database
export async function logTokenUsage(record: TokenUsageRecord): Promise<void> {
  try {
    await sql`
      INSERT INTO llm_request_log (
        tenant_id,
        app_id,
        workspace_id,
        user_id,
        provider,
        model,
        input_tokens,
        output_tokens,
        total_tokens,
        cost_cents,
        latency_ms,
        request_type,
        created_at
      ) VALUES (
        ${record.tenant_id || null},
        ${record.app_id || null},
        ${record.workspace_id || null},
        ${record.user_id || null},
        ${record.provider},
        ${record.model},
        ${record.input_tokens},
        ${record.output_tokens},
        ${record.total_tokens},
        ${record.cost_cents},
        ${record.latency_ms},
        ${record.request_type || 'chat'},
        NOW()
      )
    `;
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log token usage:', error);
  }
}

// Get usage summary for a tenant
export async function getUsageSummary(options: {
  tenantId?: number;
  appId?: number;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number; requests: number }>;
}> {
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.tenantId) {
      conditions.push(`tenant_id = $${params.length + 1}`);
      params.push(options.tenantId);
    }
    if (options.appId) {
      conditions.push(`app_id = $${params.length + 1}`);
      params.push(options.appId);
    }
    if (options.userId) {
      conditions.push(`user_id = $${params.length + 1}`);
      params.push(options.userId);
    }
    if (options.startDate) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(options.startDate);
    }
    if (options.endDate) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get totals
    const totalsQuery = await sql`
      SELECT
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost_cents), 0) as total_cost_cents
      FROM llm_request_log
      ${whereClause ? sql.unsafe(whereClause) : sql.unsafe('')}
    `;

    // Get by provider
    const byProviderQuery = await sql`
      SELECT
        provider,
        SUM(total_tokens) as tokens,
        SUM(cost_cents) as cost_cents,
        COUNT(*) as requests
      FROM llm_request_log
      ${whereClause ? sql.unsafe(whereClause) : sql.unsafe('')}
      GROUP BY provider
    `;

    const byProvider: Record<string, { tokens: number; cost: number; requests: number }> = {};
    for (const row of byProviderQuery) {
      byProvider[row.provider] = {
        tokens: Number(row.tokens) || 0,
        cost: (Number(row.cost_cents) || 0) / 100,
        requests: Number(row.requests) || 0,
      };
    }

    return {
      totalTokens: Number(totalsQuery[0]?.total_tokens) || 0,
      totalCost: (Number(totalsQuery[0]?.total_cost_cents) || 0) / 100,
      byProvider,
    };
  } catch (error) {
    console.error('Failed to get usage summary:', error);
    return {
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
    };
  }
}
