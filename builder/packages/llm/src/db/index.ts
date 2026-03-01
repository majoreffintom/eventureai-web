/**
 * Database integration for @eventureai/builder-llm
 *
 * Uses existing Neon PostgreSQL tables:
 * - llm_tournaments: Tournament configurations
 * - llm_responses: Individual model responses
 * - memory: AI memories and learnings
 * - mori_error_chains: Error tracking
 * - mori_solutions: Verified solutions
 */

// ============================================================================
// Types matching existing database schema
// ============================================================================

export interface DBTournament {
  id: number;
  app_id: number | null;
  workspace_id: number | null;
  user_id: number | null;
  prompt: string | null;
  debate_mode: boolean;
  rounds: number;
  models_used: string[] | null;
  status: string; // 'pending', 'running', 'completed', 'error'
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DBLLMResponse {
  id: number;
  tournament_id: number | null;
  model_key: string | null;
  model_provider: string | null;
  content: string | null;
  picked: boolean;
  interesting: boolean;
  created_at: string;
}

export interface DBMemory {
  id: number;
  workspace_id: number | null;
  user_id: number | null;
  app_id: number | null;
  title: string | null;
  content: string | null;
  memory_type: string | null;
  tags: string[] | null;
  domain: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBErrorChain {
  id: number;
  app_id: number | null;
  workspace_id: number | null;
  title: string | null;
  status: string | null;
  severity: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBSolution {
  id: number;
  chain_id: number | null;
  root_cause: string | null;
  solution_text: string | null;
  prevention: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  category: string | null;
  verified: boolean | null;
}

// ============================================================================
// Database Client Interface
// ============================================================================

/**
 * SQL query function type (matches Neon's sql template tag)
 */
export type SQLQuery = <T = unknown>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

/**
 * Database client configuration
 */
export interface DBClientConfig {
  sql: SQLQuery;
}

// ============================================================================
// Tournament Database Operations
// ============================================================================

/**
 * Create a new tournament record
 */
export async function createTournament(
  sql: SQLQuery,
  data: {
    prompt: string;
    debateMode: boolean;
    rounds: number;
    modelsUsed: string[];
    appId?: number;
    workspaceId?: number;
    userId?: number;
  }
): Promise<DBTournament> {
  const [tournament] = await sql<DBTournament>`
    INSERT INTO llm_tournaments (
      app_id, workspace_id, user_id, prompt, debate_mode, rounds, models_used, status
    ) VALUES (
      ${data.appId || null},
      ${data.workspaceId || null},
      ${data.userId || null},
      ${data.prompt},
      ${data.debateMode},
      ${data.rounds},
      ${data.modelsUsed},
      'pending'
    )
    RETURNING *
  `;
  return tournament;
}

/**
 * Update tournament status
 */
export async function updateTournamentStatus(
  sql: SQLQuery,
  tournamentId: number,
  status: string,
  startedAt?: Date,
  completedAt?: Date
): Promise<DBTournament> {
  const [tournament] = await sql<DBTournament>`
    UPDATE llm_tournaments
    SET
      status = ${status},
      started_at = COALESCE(${startedAt || null}, started_at),
      completed_at = COALESCE(${completedAt || null}, completed_at)
    WHERE id = ${tournamentId}
    RETURNING *
  `;
  return tournament;
}

/**
 * Get tournament by ID
 */
export async function getTournament(
  sql: SQLQuery,
  tournamentId: number
): Promise<DBTournament | null> {
  const [tournament] = await sql<DBTournament>`
    SELECT * FROM llm_tournaments WHERE id = ${tournamentId}
  `;
  return tournament || null;
}

/**
 * List tournaments with optional filters
 */
export async function listTournaments(
  sql: SQLQuery,
  filters?: {
    appId?: number;
    workspaceId?: number;
    userId?: number;
    status?: string;
    limit?: number;
  }
): Promise<DBTournament[]> {
  const limit = filters?.limit || 50;

  let query = "SELECT * FROM llm_tournaments WHERE 1=1";
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.appId) {
    query += ` AND app_id = $${paramIndex++}`;
    params.push(filters.appId);
  }
  if (filters?.workspaceId) {
    query += ` AND workspace_id = $${paramIndex++}`;
    params.push(filters.workspaceId);
  }
  if (filters?.userId) {
    query += ` AND user_id = $${paramIndex++}`;
    params.push(filters.userId);
  }
  if (filters?.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  return sql<DBTournament>(query as any, ...params);
}

// ============================================================================
// LLM Response Database Operations
// ============================================================================

/**
 * Save an LLM response
 */
export async function saveLLMResponse(
  sql: SQLQuery,
  data: {
    tournamentId: number;
    modelKey: string;
    modelProvider: string;
    content: string;
    picked?: boolean;
    interesting?: boolean;
  }
): Promise<DBLLMResponse> {
  const [response] = await sql<DBLLMResponse>`
    INSERT INTO llm_responses (
      tournament_id, model_key, model_provider, content, picked, interesting
    ) VALUES (
      ${data.tournamentId},
      ${data.modelKey},
      ${data.modelProvider},
      ${data.content},
      ${data.picked || false},
      ${data.interesting || false}
    )
    RETURNING *
  `;
  return response;
}

/**
 * Get responses for a tournament
 */
export async function getTournamentResponses(
  sql: SQLQuery,
  tournamentId: number
): Promise<DBLLMResponse[]> {
  return sql<DBLLMResponse>`
    SELECT * FROM llm_responses
    WHERE tournament_id = ${tournamentId}
    ORDER BY created_at ASC
  `;
}

/**
 * Mark a response as picked
 */
export async function pickResponse(
  sql: SQLQuery,
  responseId: number
): Promise<DBLLMResponse> {
  const [response] = await sql<DBLLMResponse>`
    UPDATE llm_responses
    SET picked = true
    WHERE id = ${responseId}
    RETURNING *
  `;
  return response;
}

// ============================================================================
// Memory Database Operations
// ============================================================================

/**
 * Create a new memory
 */
export async function createMemory(
  sql: SQLQuery,
  data: {
    title: string;
    content: string;
    memoryType: string;
    tags?: string[];
    domain?: string;
    summary?: string;
    workspaceId?: number;
    userId?: number;
  }
): Promise<DBMemory> {
  const [memory] = await sql<DBMemory>`
    INSERT INTO memories (
      workspace_id, user_id, title, content, memory_type, tags, domain, summary
    ) VALUES (
      ${data.workspaceId || null},
      ${data.userId || null},
      ${data.title},
      ${data.content},
      ${data.memoryType},
      ${data.tags || null},
      ${data.domain || null},
      ${data.summary || null}
    )
    RETURNING *
  `;
  return memory;
}

/**
 * Search memories by content using Full-Text Search
 */
export async function searchMemories(
  sql: SQLQuery,
  query: string,
  options?: {
    limit?: number;
    memoryType?: string;
    domain?: string;
  }
): Promise<DBMemory[]> {
  const limit = options?.limit || 10;
  
  // Format query for plainto_tsquery (handles multi-word search)
  let sqlQuery = `
    SELECT *, ts_rank(search_tsv, plainto_tsquery('english', $1)) as rank
    FROM memories
    WHERE search_tsv @@ plainto_tsquery('english', $1)
  `;
  const params: unknown[] = [query];
  let paramIndex = 2;

  if (options?.memoryType) {
    sqlQuery += ` AND memory_type = $${paramIndex++}`;
    params.push(options.memoryType);
  }
  if (options?.domain) {
    sqlQuery += ` AND domain = $${paramIndex++}`;
    params.push(options.domain);
  }

  sqlQuery += ` ORDER BY rank DESC, created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  return sql<DBMemory>(sqlQuery as any, ...params);
}

/**
 * Get memory count
 */
export async function getMemoryCount(sql: SQLQuery): Promise<number> {
  const [result] = await sql<{ count: string }>`
    SELECT COUNT(*) as count FROM memories
  `;
  return parseInt(result.count, 10);
}

// ============================================================================
// Error Chain Database Operations (for debugging agent)
// ============================================================================

/**
 * Create an error chain
 */
export async function createErrorChain(
  sql: SQLQuery,
  data: {
    title: string;
    description: string;
    severity?: string;
    appId?: number;
    workspaceId?: number;
  }
): Promise<DBErrorChain> {
  const [chain] = await sql<DBErrorChain>`
    INSERT INTO mori_error_chains (
      app_id, workspace_id, title, status, severity, description
    ) VALUES (
      ${data.appId || null},
      ${data.workspaceId || null},
      ${data.title},
      'open',
      ${data.severity || 'medium'},
      ${data.description}
    )
    RETURNING *
  `;
  return chain;
}

/**
 * Search error chains for similar errors
 */
export async function searchErrorChains(
  sql: SQLQuery,
  query: string,
  limit?: number
): Promise<DBErrorChain[]> {
  const searchPattern = `%${query}%`;
  return sql<DBErrorChain>`
    SELECT * FROM mori_error_chains
    WHERE title ILIKE ${searchPattern} OR description ILIKE ${searchPattern}
    ORDER BY created_at DESC
    LIMIT ${limit || 5}
  `;
}

/**
 * Get solutions for an error chain
 */
export async function getSolutionsForChain(
  sql: SQLQuery,
  chainId: number
): Promise<DBSolution[]> {
  return sql<DBSolution>`
    SELECT * FROM mori_solutions
    WHERE chain_id = ${chainId}
    ORDER BY verified DESC, created_at DESC
  `;
}

/**
 * Create a solution
 */
export async function createSolution(
  sql: SQLQuery,
  data: {
    chainId: number;
    rootCause: string;
    solutionText: string;
    prevention?: string;
    category?: string;
    tags?: string[];
  }
): Promise<DBSolution> {
  const [solution] = await sql<DBSolution>`
    INSERT INTO mori_solutions (
      chain_id, root_cause, solution_text, prevention, category, tags
    ) VALUES (
      ${data.chainId},
      ${data.rootCause},
      ${data.solutionText},
      ${data.prevention || null},
      ${data.category || null},
      ${data.tags || null}
    )
    RETURNING *
  `;
  return solution;
}

// ============================================================================
// Exports
// ============================================================================

export const db = {
  tournament: {
    create: createTournament,
    updateStatus: updateTournamentStatus,
    get: getTournament,
    list: listTournaments,
  },
  response: {
    save: saveLLMResponse,
    getForTournament: getTournamentResponses,
    pick: pickResponse,
  },
  memory: {
    create: createMemory,
    search: searchMemories,
    count: getMemoryCount,
  },
  errorChain: {
    create: createErrorChain,
    search: searchErrorChains,
    getSolutions: getSolutionsForChain,
  },
  solution: {
    create: createSolution,
  },
};

export default db;

// Re-export from integration module
export {
  runTournamentWithDB,
  createDBTournamentRunner,
} from "./integration.js";

// Export Neon client and helpers
export {
  createNeonClient,
  sql,
  getSQL,
} from "./neon.js";
