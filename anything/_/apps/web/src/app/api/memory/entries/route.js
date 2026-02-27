import sql from "@/app/api/utils/sql";

// Memory key validation and context assignment
function getMemoryContext(content) {
  const enterpriseKeywords = [
    "eventureai",
    "business model",
    "corporation",
    "mission",
    "vision",
    "strategy",
    "wyoming",
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
  const appKeywords = [
    "api",
    "database",
    "frontend",
    "backend",
    "deployment",
    "code",
    "react",
    "sql",
  ];

  const lowerContent = content.toLowerCase();

  if (enterpriseKeywords.some((keyword) => lowerContent.includes(keyword))) {
    return {
      context: "enterprise",
      key: process.env.ENTERPRISE_MEMORY_KEY,
      priority: "high",
    };
  } else if (
    businessKeywords.some((keyword) => lowerContent.includes(keyword))
  ) {
    return {
      context: "business",
      key: process.env.BUSINESS_MEMORY_KEY,
      priority: "medium",
    };
  } else {
    return {
      context: "app",
      key: process.env.APP_MEMORY_KEY,
      priority: "normal",
    };
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const clusterId = url.searchParams.get("cluster_id");
    const search = url.searchParams.get("search");
    const limit = url.searchParams.get("limit") || 50;

    let entries;
    if (clusterId) {
      entries = await sql`
        SELECT 
          me.*,
          sic.cluster_name,
          ic.name as category_name,
          ic.intent_type,
          ic.complexity_level
        FROM memory_entries me
        LEFT JOIN sub_index_clusters sic ON me.sub_index_cluster_id = sic.id
        LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
        WHERE me.sub_index_cluster_id = ${clusterId}
        ORDER BY me.accessed_at DESC, me.usage_frequency DESC
        LIMIT ${limit}
      `;
    } else if (search) {
      entries = await sql`
        SELECT 
          me.*,
          sic.cluster_name,
          ic.name as category_name,
          ic.intent_type,
          ic.complexity_level,
          ts_rank(to_tsvector('english', me.content), plainto_tsquery('english', ${search})) as rank
        FROM memory_entries me
        LEFT JOIN sub_index_clusters sic ON me.sub_index_cluster_id = sic.id
        LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
        WHERE to_tsvector('english', me.content) @@ plainto_tsquery('english', ${search})
           OR me.user_intent_analysis ILIKE ${"%" + search + "%"}
           OR ${search} = ANY(me.cross_domain_connections)
        ORDER BY rank DESC, me.usage_frequency DESC
        LIMIT ${limit}
      `;
    } else {
      entries = await sql`
        SELECT 
          me.*,
          sic.cluster_name,
          ic.name as category_name,
          ic.intent_type,
          ic.complexity_level
        FROM memory_entries me
        LEFT JOIN sub_index_clusters sic ON me.sub_index_cluster_id = sic.id
        LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
        ORDER BY me.accessed_at DESC
        LIMIT ${limit}
      `;
    }

    return Response.json({ entries });
  } catch (error) {
    console.error("Error fetching memory entries:", error);
    return Response.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      sub_index_cluster_id,
      content,
      reasoning_chain,
      user_intent_analysis,
      cross_domain_connections,
      session_context,
    } = body;

    if (!content) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // Determine memory context and assign appropriate key
    const memoryContext = getMemoryContext(content);

    // Validate that the memory key exists
    if (!memoryContext.key) {
      console.warn(`Missing memory key for context: ${memoryContext.context}`);
    }

    const [entry] = await sql`
      INSERT INTO memory_entries (
        sub_index_cluster_id,
        content, 
        reasoning_chain, 
        user_intent_analysis, 
        cross_domain_connections, 
        session_context
      )
      VALUES (
        ${sub_index_cluster_id},
        ${content}, 
        ${reasoning_chain}, 
        ${user_intent_analysis}, 
        ${cross_domain_connections || []}, 
        ${session_context}
      )
      RETURNING *
    `;

    // Log memory context for tracking
    console.log(
      `Memory entry ${entry.id} assigned to context: ${memoryContext.context} with priority: ${memoryContext.priority}`,
    );

    return Response.json({
      entry,
      memory_context: {
        context: memoryContext.context,
        priority: memoryContext.priority,
        key_assigned: !!memoryContext.key,
      },
    });
  } catch (error) {
    console.error("Error creating memory entry:", error);
    return Response.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
