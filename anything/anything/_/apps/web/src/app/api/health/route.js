export async function GET() {
  const result = {
    ok: true,
    time: new Date().toISOString(),
    env: process.env.ENV || null,
    nodeEnv: process.env.NODE_ENV || null,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasAuthUrl: !!process.env.AUTH_URL,
    hasAppUrl: !!process.env.APP_URL,
    database: {
      ok: false,
      error: null,
    },
    auth: {
      importOk: false,
      error: null,
    },
  };

  // Database check
  try {
    const { default: sql } = await import("@/app/api/utils/sql");
    await sql("SELECT 1 as ok", []);
    result.database.ok = true;
  } catch (e) {
    result.ok = false;
    result.database.ok = false;
    result.database.error = e?.message || String(e);
  }

  // Auth import check (dynamic import so we can report failures)
  try {
    await import("@/auth");
    result.auth.importOk = true;
  } catch (e) {
    result.ok = false;
    result.auth.importOk = false;
    result.auth.error = e?.message || String(e);
  }

  return Response.json(result);
}
