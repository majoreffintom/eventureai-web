import { statements } from "./statements/index";
import { applyStatements } from "./utils/apply-statements";

export async function POST() {
  const result = await applyStatements(statements);

  if (!result.success) {
    return Response.json(
      {
        ok: false,
        failedAt: result.failedAt,
        statementPreview: result.statementPreview,
        error: result.error,
        applied: result.applied,
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, appliedCount: result.appliedCount });
}
