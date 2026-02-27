import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const rows = await sql(
      `SELECT m.id,
              m.movement_type,
              m.quantity,
              m.reference_type,
              m.reference_id,
              m.notes,
              m.occurred_at,
              i.id AS item_id,
              i.name AS item_name,
              lf.id AS from_location_id,
              lf.name AS from_location_name,
              lt.id AS to_location_id,
              lt.name AS to_location_name
         FROM inventory_movements m
         JOIN inventory_items i ON i.id = m.item_id
         LEFT JOIN inventory_locations lf ON lf.id = m.from_location_id
         LEFT JOIN inventory_locations lt ON lt.id = m.to_location_id
        WHERE i.is_deleted = false
        ORDER BY m.occurred_at DESC
        LIMIT 50`,
    );

    return Response.json({ movements: rows || [] });
  } catch (error) {
    console.error("GET /api/admin/inventory/movements/recent error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
