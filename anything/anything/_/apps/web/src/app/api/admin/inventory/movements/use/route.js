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
      from_location_id,
      quantity,
      reference_type,
      reference_id,
      notes,
    } = body || {};

    const safeItemId = typeof item_id === "string" ? item_id : null;
    const safeFromLocationId =
      typeof from_location_id === "string" ? from_location_id : null;

    const qty = Number(quantity);
    const safeQty = Number.isFinite(qty) ? qty : NaN;

    if (
      !safeItemId ||
      !safeFromLocationId ||
      !Number.isFinite(safeQty) ||
      safeQty <= 0
    ) {
      return Response.json(
        {
          error:
            "item_id, from_location_id, and positive quantity are required",
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

    const txnResults = await sql.transaction(async (txn) => {
      // Subtract stock (only if enough)
      const updatedRows = await txn(
        `UPDATE inventory_stock
            SET quantity = round(quantity - $3, 2),
                updated_at = now()
          WHERE item_id = $1
            AND location_id = $2
            AND quantity >= $3
          RETURNING item_id, location_id, quantity`,
        [safeItemId, safeFromLocationId, safeQty],
      );

      if (!updatedRows?.[0]) {
        throw new Error("Not enough stock at that location");
      }

      await txn(
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
         VALUES ('use', $1, $2, NULL, $3, $4, $5, $6, $7)`,
        [
          safeItemId,
          safeFromLocationId,
          safeQty,
          safeRefType,
          safeRefId,
          safeNotes,
          userId,
        ],
      );

      return updatedRows;
    });

    const stockRow = txnResults?.[0] || null;
    return Response.json({ stock: stockRow });
  } catch (error) {
    const msg = error?.message || "Internal Server Error";
    const isStock = msg.toLowerCase().includes("not enough stock");

    if (isStock) {
      return Response.json({ error: msg }, { status: 409 });
    }

    console.error("POST /api/admin/inventory/movements/use error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
