import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const rows = await sql(
      `SELECT id, name, slug, description, domain, is_active, config, created_at, updated_at
         FROM tenants
        ORDER BY id ASC`
    );

    return Response.json({ tenants: rows || [] });
  } catch (error) {
    console.error("GET /api/admin/tenants error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => null);
    const { name, slug, description, domain, is_active, config } = body || {};

    const safeName = typeof name === "string" ? name.trim() : "";
    if (!safeName) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const safeSlug = typeof slug === "string" ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : "";
    if (!safeSlug) {
      return Response.json({ error: "Slug is required" }, { status: 400 });
    }

    const safeDomain = typeof domain === "string" ? domain.trim() : null;
    const safeDescription = typeof description === "string" ? description.trim() : null;
    const safeIsActive = typeof is_active === "boolean" ? is_active : true;
    const safeConfig = config || {};

    const rows = await sql(
      `INSERT INTO tenants (name, slug, description, domain, is_active, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, description, domain, is_active, config, created_at, updated_at`,
      [safeName, safeSlug, safeDescription, safeDomain, safeIsActive, JSON.stringify(safeConfig)]
    );

    return Response.json({ tenant: rows?.[0] || null });
  } catch (error) {
    console.error("POST /api/admin/tenants error", error);

    if (error.code === '23505') {
      return Response.json({ error: "Slug or domain already exists" }, { status: 409 });
    }

    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
