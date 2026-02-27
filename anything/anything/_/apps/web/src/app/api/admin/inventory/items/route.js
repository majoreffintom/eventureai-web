import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const [items, stock] = await sql.transaction((txn) => [
      txn(
        `SELECT i.id,
                i.name,
                i.sku,
                i.unit,
                i.is_active,
                i.created_at,
                i.updated_at,
                COALESCE(round(SUM(s.quantity), 2), 0) AS total_quantity
           FROM inventory_items i
           LEFT JOIN inventory_stock s ON s.item_id = i.id
           LEFT JOIN inventory_locations l ON l.id = s.location_id AND l.is_deleted = false
          WHERE i.is_deleted = false
          GROUP BY i.id
          ORDER BY i.created_at DESC
          LIMIT 500`,
      ),
      txn(
        `SELECT s.item_id,
                s.location_id,
                l.name AS location_name,
                l.location_type,
                s.quantity
           FROM inventory_stock s
           JOIN inventory_locations l ON l.id = s.location_id
           JOIN inventory_items i ON i.id = s.item_id
          WHERE i.is_deleted = false
            AND l.is_deleted = false
          ORDER BY l.location_type ASC, l.name ASC`,
      ),
    ]);

    return Response.json({ items: items || [], stock: stock || [] });
  } catch (error) {
    console.error("GET /api/admin/inventory/items error", error);
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
    const { name, sku, unit } = body || {};

    const safeName = typeof name === "string" ? name.trim() : "";
    if (!safeName) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const safeSku = typeof sku === "string" && sku.trim() ? sku.trim() : null;
    const safeUnit =
      typeof unit === "string" && unit.trim() ? unit.trim() : "each";

    const existing = await sql(
      `SELECT id
         FROM inventory_items
        WHERE is_deleted = false
          AND lower(name) = lower($1)
        LIMIT 1`,
      [safeName],
    );

    if (existing?.[0]?.id) {
      return Response.json(
        { error: "An item with that name already exists" },
        { status: 409 },
      );
    }

    const rows = await sql(
      `INSERT INTO inventory_items (name, sku, unit)
       VALUES ($1, $2, $3)
       RETURNING id, name, sku, unit, is_active, created_at, updated_at`,
      [safeName, safeSku, safeUnit],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (error) {
    console.error("POST /api/admin/inventory/items error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
