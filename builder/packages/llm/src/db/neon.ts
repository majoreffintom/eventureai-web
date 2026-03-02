import { neon } from '@neondatabase/serverless';

/**
 * SQL query function type (matches Neon's sql template tag)
 * Duplicated to avoid circular dependency
 */
type SQLQuery = <T = unknown>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

/**
 * Create a Neon SQL client from a connection string
 */
export function createNeonClient(connectionString: string): SQLQuery {
  return neon(connectionString) as unknown as SQLQuery;
}

/**
 * Environment-aware SQL clients
 */
export const connections = {
  dev: process.env.DATABASE_DEV_URL || process.env.DATABASE_URL 
    ? createNeonClient(process.env.DATABASE_DEV_URL || process.env.DATABASE_URL!)
    : null,
  live: process.env.DATABASE_LIVE_URL 
    ? createNeonClient(process.env.DATABASE_LIVE_URL)
    : null,
};

/**
 * Default SQL client using DATABASE_URL environment variable
 */
export const sql = connections.dev || connections.live;

/**
 * Get the SQL client for a specific environment
 */
export function getSQL(env: 'dev' | 'live' = 'dev'): SQLQuery {
  const client = connections[env] || sql;
  if (!client) {
    throw new Error(
      `Database not configured for ${env}. Set DATABASE_${env.toUpperCase()}_URL environment variable.`
    );
  }
  return client;
}
