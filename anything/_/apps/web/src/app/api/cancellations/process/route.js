import sql from "@/app/api/utils/sql";

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || "all"; // subscriptions | invoices | pattern_requests | all
    const limit = Math.max(1, Math.min(100, body.limit || 10));

    const results = {};

    const typesToProcess =
      type === "all"
        ? ["subscriptions", "invoices", "pattern_requests"]
        : [type];

    for (const t of typesToProcess) {
      switch (t) {
        case "subscriptions":
          results.subscriptions = await processSubscriptions(limit);
          break;
        case "invoices":
          results.invoices = await processInvoices(limit);
          break;
        case "pattern_requests":
          results.pattern_requests = await processPatternRequests(limit);
          break;
        default:
          break;
      }
    }

    const processed = Object.values(results).reduce(
      (sum, r) => sum + (r?.processed_count || 0),
      0,
    );

    return Response.json({ success: true, processed, results });
  } catch (error) {
    console.error("cancellations/process error", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

async function processSubscriptions(limit) {
  // Find cancelled subscriptions not yet audited
  const rows = await sql(
    `
    SELECT s.id, s.customer_id, s.app_id, s.plan_name, s.status, s.cancelled_at
    FROM subscriptions s
    LEFT JOIN cancellation_audit a
      ON a.item_type = 'subscription' AND a.item_id = s.id
    WHERE (s.status = 'cancelled' OR s.cancelled_at IS NOT NULL)
      AND a.id IS NULL
    ORDER BY COALESCE(s.cancelled_at, s.updated_at, s.created_at) DESC NULLS LAST
    LIMIT $1
  `,
    [limit],
  );

  let processed = 0;
  for (const row of rows) {
    const summary = `Subscription ${row.id} (${row.plan_name || "plan"}) for app ${row.app_id || "-"} cancelled on ${row.cancelled_at || "unknown"}`;
    try {
      await sql(
        `INSERT INTO cancellation_audit (item_type, item_id, summary, processed, processed_at)
         VALUES ('subscription', $1, $2, TRUE, NOW())
         ON CONFLICT (item_type, item_id) DO NOTHING`,
        [row.id, summary],
      );
      processed += 1;
    } catch (e) {
      console.error("audit insert failed (subscription)", e);
    }
  }

  return {
    type: "subscriptions",
    processed_count: processed,
    candidates: rows.length,
  };
}

async function processInvoices(limit) {
  const rows = await sql(
    `
    SELECT i.id, i.customer_id, i.app_id, i.invoice_number, i.status, i.updated_at
    FROM invoices i
    LEFT JOIN cancellation_audit a
      ON a.item_type = 'invoice' AND a.item_id = i.id
    WHERE i.status = 'cancelled' AND a.id IS NULL
    ORDER BY COALESCE(i.updated_at, i.created_at) DESC NULLS LAST
    LIMIT $1
  `,
    [limit],
  );

  let processed = 0;
  for (const row of rows) {
    const summary = `Invoice ${row.invoice_number || row.id} for app ${row.app_id || "-"} marked cancelled`;
    try {
      await sql(
        `INSERT INTO cancellation_audit (item_type, item_id, summary, processed, processed_at)
         VALUES ('invoice', $1, $2, TRUE, NOW())
         ON CONFLICT (item_type, item_id) DO NOTHING`,
        [row.id, summary],
      );
      processed += 1;
    } catch (e) {
      console.error("audit insert failed (invoice)", e);
    }
  }

  return {
    type: "invoices",
    processed_count: processed,
    candidates: rows.length,
  };
}

async function processPatternRequests(limit) {
  const rows = await sql(
    `
    SELECT p.id, p.requesting_app_id, p.pattern_need, p.status, p.updated_at
    FROM pattern_requests p
    LEFT JOIN cancellation_audit a
      ON a.item_type = 'pattern_request' AND a.item_id = p.id
    WHERE p.status = 'cancelled' AND a.id IS NULL
    ORDER BY COALESCE(p.updated_at, p.created_at) DESC NULLS LAST
    LIMIT $1
  `,
    [limit],
  );

  let processed = 0;
  for (const row of rows) {
    const summary = `Pattern request ${row.id} ('${row.pattern_need || "need"}') cancelled`;
    try {
      await sql(
        `INSERT INTO cancellation_audit (item_type, item_id, summary, processed, processed_at)
         VALUES ('pattern_request', $1, $2, TRUE, NOW())
         ON CONFLICT (item_type, item_id) DO NOTHING`,
        [row.id, summary],
      );
      processed += 1;
    } catch (e) {
      console.error("audit insert failed (pattern_request)", e);
    }
  }

  return {
    type: "pattern_requests",
    processed_count: processed,
    candidates: rows.length,
  };
}
