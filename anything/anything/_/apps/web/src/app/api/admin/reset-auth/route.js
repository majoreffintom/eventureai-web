import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin";

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    // Extra safety: only owner can run a reset.
    if (guard.role !== "owner") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));

    const normalizeEmails = body?.normalizeEmails !== false; // default true
    const clearSessions = body?.clearSessions !== false; // default true
    const clearVerificationTokens = body?.clearVerificationTokens !== false; // default true
    const dryRun = body?.dryRun === true;

    // Before normalizing emails, check for duplicates once lowercased.
    // If duplicates exist, we refuse to normalize to avoid making sign-in ambiguous.
    const duplicates = await sql(
      `
      SELECT LOWER(email) AS email, COUNT(*)::int AS count
      FROM auth_users
      WHERE email IS NOT NULL
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 50
      `,
    );

    if (normalizeEmails && duplicates.length > 0) {
      return Response.json(
        {
          error:
            "Cannot normalize emails because duplicates exist (same email differing only by case). Resolve duplicates first.",
          duplicates,
        },
        { status: 409 },
      );
    }

    let emailsNormalized = 0;
    let sessionsDeleted = 0;
    let verificationTokensDeleted = 0;

    if (!dryRun && normalizeEmails) {
      const updated = await sql(
        "UPDATE auth_users SET email = LOWER(email) WHERE email IS NOT NULL AND email <> LOWER(email) RETURNING id",
      );
      emailsNormalized = updated.length;
    }

    if (!dryRun && clearSessions) {
      const deleted = await sql("DELETE FROM auth_sessions RETURNING id");
      sessionsDeleted = deleted.length;
    }

    if (!dryRun && clearVerificationTokens) {
      const deleted = await sql(
        "DELETE FROM auth_verification_token RETURNING token",
      );
      verificationTokensDeleted = deleted.length;
    }

    return Response.json({
      dryRun,
      normalizeEmails,
      clearSessions,
      clearVerificationTokens,
      emailsNormalized,
      sessionsDeleted,
      verificationTokensDeleted,
    });
  } catch (error) {
    console.error("POST /api/admin/reset-auth error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
