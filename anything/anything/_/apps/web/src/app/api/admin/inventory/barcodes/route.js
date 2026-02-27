import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin.js";

function normalizeBarcode(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const url = new URL(request.url);
    const barcode = normalizeBarcode(url.searchParams.get("barcode") || "");
    if (!barcode) {
      return Response.json({ error: "barcode is required" }, { status: 400 });
    }

    const rows = await sql(
      `SELECT i.id, i.name, i.sku, i.unit
         FROM inventory_item_barcodes b
         JOIN inventory_items i ON i.id = b.item_id
        WHERE b.barcode = $1
          AND i.is_deleted = false
        LIMIT 1`,
      [barcode],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (error) {
    console.error("GET /api/admin/inventory/barcodes error", error);
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
    const barcode = normalizeBarcode(body?.barcode);
    const itemId = typeof body?.item_id === "string" ? body.item_id : "";

    if (!barcode || !itemId) {
      return Response.json(
        { error: "barcode and item_id are required" },
        { status: 400 },
      );
    }

    const itemRows = await sql(
      `SELECT id
         FROM inventory_items
        WHERE id = $1
          AND is_deleted = false
        LIMIT 1`,
      [itemId],
    );

    if (!itemRows?.[0]?.id) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    await sql(
      `INSERT INTO inventory_item_barcodes (barcode, item_id)
       VALUES ($1, $2)
       ON CONFLICT (barcode)
       DO UPDATE SET item_id = EXCLUDED.item_id`,
      [barcode, itemId],
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/inventory/barcodes error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
