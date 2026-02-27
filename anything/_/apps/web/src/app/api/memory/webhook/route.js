import sql from "@/app/api/utils/sql";

const ALLOWED_TYPES = new Set(["app", "business", "enterprise"]);

function inferTypeFromContent(content) {
  if (!content) return "app";
  const lower = String(content).toLowerCase();
  const enterpriseKeywords = [
    "eventureai",
    "corporation",
    "mission",
    "vision",
    "strategy",
    "wyoming",
    "holding company",
  ];
  const businessKeywords = [
    "revenue",
    "customer",
    "finance",
    "transaction",
    "subscription",
    "invoice",
    "stripe",
    "payment",
  ];
  if (enterpriseKeywords.some((k) => lower.includes(k))) return "enterprise";
  if (businessKeywords.some((k) => lower.includes(k))) return "business";
  return "app";
}

function memoryKeyForType(type) {
  switch (type) {
    case "enterprise":
      return process.env.ENTERPRISE_MEMORY_KEY;
    case "business":
      return process.env.BUSINESS_MEMORY_KEY;
    case "app":
    default:
      return process.env.APP_MEMORY_KEY;
  }
}

export async function POST(request) {
  try {
    // Auth using CRON_SECRET so other apps only need a single shared key
    const authHeader = request.headers.get("authorization");
    const provided = authHeader?.replace("Bearer ", "");
    if (!provided || provided !== process.env.CRON_SECRET) {
      return Response.json(
        { error: "Unauthorized: invalid webhook secret" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { content, type, context, source, metadata } = body || {};

    if (!content || !String(content).trim()) {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const chosenType = ALLOWED_TYPES.has(type)
      ? type
      : inferTypeFromContent(content);
    const memoryKey = memoryKeyForType(chosenType);

    if (!process.env.EVENTUREAI_API_KEY || !memoryKey) {
      return Response.json(
        { error: "EventureAI not configured for this memory type" },
        { status: 500 },
      );
    }

    // 1) Store locally for audit + retrieval
    const [entry] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content,
        reasoning_chain,
        user_intent_analysis,
        cross_domain_connections,
        session_context,
        usage_frequency,
        created_at,
        accessed_at
      ) VALUES (
        NULL,
        ${content},
        ${"Inbound webhook capture"},
        ${context?.user_intent || null},
        ${Array.isArray(context?.connections) ? context.connections : []},
        ${`Inbound from ${source || "external-app"} • type=${chosenType}`},
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    // 2) Forward to EventureAI using our internal API to keep logic consistent
    let forward;
    try {
      const res = await fetch(
        `${process.env.APP_URL}/api/eventureai/memories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: chosenType,
            memory: content,
            context: {
              ...context,
              source: source || "webhook",
              metadata: metadata || {},
              local_memory_id: entry.id,
            },
          }),
        },
      );
      forward = {
        ok: res.ok,
        status: res.status,
        data: res.ok ? await res.json() : await res.text(),
      };
    } catch (err) {
      forward = { ok: false, status: 500, data: String(err) };
    }

    return Response.json({
      success: true,
      stored_id: entry.id,
      memory_type: chosenType,
      forwarded: forward,
    });
  } catch (error) {
    console.error("Webhook capture failed:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
