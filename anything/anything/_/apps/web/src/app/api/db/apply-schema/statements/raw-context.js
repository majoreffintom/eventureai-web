export const rawContextStatements = [
  `CREATE TABLE IF NOT EXISTS raw_context (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );`,

  // If the table already existed (older deployments), add created_at safely.
  `ALTER TABLE raw_context
    ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();`,

  // Helpful for listing newest-first.
  `CREATE INDEX IF NOT EXISTS raw_context_created_at_idx
    ON raw_context (created_at DESC);`,
];
