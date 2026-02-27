import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const rows = await sql(
      `SELECT id,
              name,
              location_type,
              is_active,
              created_at,
              updated_at
         FROM inventory_locations
        WHERE is_deleted = false
        ORDER BY location_type ASC, name ASC`,
    );

    return Response.json({ locations: rows || [] });
  } catch (error) {
    console.error("GET /api/admin/inventory/locations error", error);
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
    const { name, location_type } = body || {};

    const safeName = typeof name === "string" ? name.trim() : "";
    if (!safeName) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const allowedTypes = ["shop", "truck", "other"];
    const safeType = allowedTypes.includes(location_type)
      ? location_type
      : "other";

    // Case-insensitive uniqueness (matches index)
    const existing = await sql(
      `SELECT id
         FROM inventory_locations
        WHERE is_deleted = false
          AND lower(name) = lower($1)
        LIMIT 1`,
      [safeName],
    );

    if (existing?.[0]?.id) {
      return Response.json(
        { error: "A location with that name already exists" },
        { status: 409 },
      );
    }

    const rows = await sql(
      `INSERT INTO inventory_locations (name, location_type)
       VALUES ($1, $2)
       RETURNING id, name, location_type, is_active, created_at, updated_at`,
      [safeName, safeType],
    );

    return Response.json({ location: rows?.[0] || null });
  } catch (error) {
    console.error("POST /api/admin/inventory/locations error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
