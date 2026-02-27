import sql from "@/app/api/utils/sql";

export async function applyStatements(statements) {
  const applied = [];

  for (let i = 0; i < statements.length; i += 1) {
    const stmt = statements[i];
    try {
      await sql(stmt);
      applied.push({ idx: i, ok: true });
    } catch (error) {
      return {
        success: false,
        failedAt: i,
        statementPreview: stmt.slice(0, 240),
        error: error?.message || String(error),
        applied,
      };
    }
  }

  return {
    success: true,
    appliedCount: applied.length,
  };
}
