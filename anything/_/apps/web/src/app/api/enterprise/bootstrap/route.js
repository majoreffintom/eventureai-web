import sql from "@/app/api/utils/sql";
import { upsertIndexAndSubindex } from "@/app/api/utils/memoriaStore";
import { requireSession } from "@/app/api/tournament/utils";

const ENTERPRISE_INDEX_KEY = "Enterprise_Dashboard";
const DEFAULT_APP_SOURCE = "enterprise_dashboard";

const PORTFOLIO_APPS = [
  // NEW: default bucket for any conversation that doesn't clearly mention a specific app
  { key: "eventureai", name: "EventureAI" },
  { key: "ditzl", name: "Ditzl" },
  { key: "lumina", name: "Lumina" },
  { key: "rosebud", name: "Rosebud" },
  { key: "resty", name: "Resty" },
  { key: "memoria", name: "Memoria" },
  { key: "chainy", name: "Chainy" },
  // NFT marketplace app
  { key: "nifty", name: "Nifty" },
];

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

async function upsertEnterpriseApps() {
  for (const app of PORTFOLIO_APPS) {
    await sql`
      INSERT INTO enterprise_apps (key, name)
      VALUES (${app.key}, ${app.name})
      ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
    `;
  }
}

export async function GET() {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const apps = await sql`
      SELECT key, name, created_at
      FROM enterprise_apps
      ORDER BY key ASC
    `;

    return Response.json({
      ok: true,
      indexKey: ENTERPRISE_INDEX_KEY,
      app_source: DEFAULT_APP_SOURCE,
      apps,
    });
  } catch (e) {
    console.error("/api/enterprise/bootstrap GET error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to load bootstrap data" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const appSource =
      safeStr(body?.app_source || body?.appSource) || DEFAULT_APP_SOURCE;

    await upsertEnterpriseApps();

    const subindexes = [];
    let memoriaIndexId = null;

    for (const app of PORTFOLIO_APPS) {
      const { memoriaIndexId: idxId, memoriaSubindexId } =
        await upsertIndexAndSubindex({
          indexKey: ENTERPRISE_INDEX_KEY,
          subindexKey: app.key,
        });

      if (!memoriaIndexId) {
        memoriaIndexId = idxId;
      }

      subindexes.push({
        app_key: app.key,
        memoria_subindex_id: memoriaSubindexId,
      });
    }

    const apps = await sql`
      SELECT key, name, created_at
      FROM enterprise_apps
      ORDER BY key ASC
    `;

    return Response.json({
      ok: true,
      app_source: appSource,
      indexKey: ENTERPRISE_INDEX_KEY,
      memoria_index_id: memoriaIndexId,
      subindexes,
      apps,
      note: "Safe to run multiple times (idempotent upserts).",
    });
  } catch (e) {
    console.error("/api/enterprise/bootstrap POST error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to bootstrap" },
      { status: 500 },
    );
  }
}
