import sql from "@/app/api/utils/sql";

function isValidEmail(email) {
  if (!email) {
    return false;
  }
  const value = String(email).trim();
  if (value.length < 5) {
    return false;
  }
  return value.includes("@") && value.includes(".");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email;

    if (!isValidEmail(email)) {
      return Response.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const fullName = body?.full_name || null;
    const company = body?.company || null;
    const notes = body?.notes || null;
    const source = body?.source || "website";

    const [row] = await sql`
      INSERT INTO beta_waitlist (email, full_name, company, notes, source)
      VALUES (${String(email).trim().toLowerCase()}, ${fullName}, ${company}, ${notes}, ${source})
      ON CONFLICT (email)
      DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, beta_waitlist.full_name),
        company = COALESCE(EXCLUDED.company, beta_waitlist.company),
        notes = COALESCE(EXCLUDED.notes, beta_waitlist.notes),
        source = COALESCE(EXCLUDED.source, beta_waitlist.source),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, created_at, updated_at
    `;

    return Response.json({ success: true, waitlist: row });
  } catch (error) {
    console.error("/api/beta/waitlist POST error:", error);
    return Response.json(
      { error: "Could not save beta signup" },
      { status: 500 },
    );
  }
}

// Simple admin read (no auth in this app yet).
// If you want this locked down, tell me and I’ll enforce X-API-Key.
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit") || "50";
    const limit = Math.max(1, Math.min(200, Number(limitRaw) || 50));

    const rows = await sql(
      "SELECT id, email, full_name, company, notes, source, created_at, updated_at FROM beta_waitlist ORDER BY created_at DESC LIMIT $1",
      [limit],
    );

    return Response.json({ success: true, waitlist: rows });
  } catch (error) {
    console.error("/api/beta/waitlist GET error:", error);
    return Response.json(
      { error: "Could not load beta waitlist" },
      { status: 500 },
    );
  }
}
