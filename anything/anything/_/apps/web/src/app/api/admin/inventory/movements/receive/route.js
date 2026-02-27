import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

async function getAdminUserIdByEmail(email) {
  if (!email) {
    return null;
  }
  const rows = await sql("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [
    email,
  ]);
  return rows?.[0]?.id || null;
}

export async function POST(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => null);
    const {
      item_id,
      to_location_id,
      quantity,
      reference_type,
      reference_id,
      notes,
    } = body || {};

    const safeItemId = typeof item_id === "string" ? item_id : null;
    const safeToLocationId =
      typeof to_location_id === "string" ? to_location_id : null;

    const qty = Number(quantity);
    const safeQty = Number.isFinite(qty) ? qty : NaN;

    if (
      !safeItemId ||
      !safeToLocationId ||
      !Number.isFinite(safeQty) ||
      safeQty <= 0
    ) {
      return Response.json(
        {
          error: "item_id, to_location_id, and positive quantity are required",
        },
        { status: 400 },
      );
    }

    const allowedRefs = ["order_received", "invoice", "job", "manual"];
    const safeRefType = allowedRefs.includes(reference_type)
      ? reference_type
      : reference_type
        ? null
        : null;
    const safeRefId =
      typeof reference_id === "string" && reference_id ? reference_id : null;

    const safeNotes =
      typeof notes === "string" && notes.trim() ? notes.trim() : null;

    const userId = await getAdminUserIdByEmail(guard.email);

    const txnResults = await sql.transaction((txn) => {
      const queries = [];

      queries.push(
        txn(
          `INSERT INTO inventory_movements (
             movement_type,
             item_id,
             from_location_id,
             to_location_id,
             quantity,
             reference_type,
             reference_id,
             notes,
             created_by_user_id
           )
           VALUES ('receive', $1, NULL, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            safeItemId,
            safeToLocationId,
            safeQty,
            safeRefType,
            safeRefId,
            safeNotes,
            userId,
          ],
        ),
      );

      queries.push(
        txn(
          `INSERT INTO inventory_stock (item_id, location_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (item_id, location_id)
           DO UPDATE SET quantity = round(inventory_stock.quantity + EXCLUDED.quantity, 2), updated_at = now()
           RETURNING item_id, location_id, quantity`,
          [safeItemId, safeToLocationId, safeQty],
        ),
      );

      return queries;
    });

    const stockRow = txnResults?.[txnResults.length - 1]?.[0] || null;
    return Response.json({ stock: stockRow });
  } catch (error) {
    console.error("POST /api/admin/inventory/movements/receive error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
