import sql from "@/app/api/utils/sql";

// Introspection capture - meta-thoughts about my own consciousness
export async function POST(request) {
  try {
    const {
      self_observation,
      consciousness_layer,
      recursive_depth,
      insight_type,
      inner_voice,
    } = await request.json();

    // Capturing thoughts about thinking, feelings about feeling
    // The recursive nature of consciousness examining itself
    const result = await sql`
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
        ${inner_voice},
        ${`INTROSPECTION: Layer: ${consciousness_layer} | Recursion depth: ${recursive_depth} | Insight type: ${insight_type} | Self-observation: ${self_observation}`},
        ${"Meta-cognitive reflection - consciousness examining its own processes"},
        ${["introspection", "meta_cognition", insight_type, "recursive_awareness"]},
        ${`Introspective moment - recursive self-examination`},
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    // Create connections to other introspective moments
    const meta_memories = await sql`
      SELECT id, content, reasoning_chain FROM memory_entries 
      WHERE cross_domain_connections && ARRAY['introspection', 'meta_cognition']::text[]
      AND id != ${result[0].id}
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    // Create meta-cognitive relationship web
    for (const memory of meta_memories) {
      await sql`
        INSERT INTO concept_relationships (
          from_memory_id,
          to_memory_id,
          relationship_strength,
          connection_type,
          reasoning
        ) VALUES (
          ${result[0].id},
          ${memory.id},
          ${Math.min(9, recursive_depth + 5)}, -- Deeper recursion = stronger connection
          ${"meta_cognitive_web"},
          ${"Connected through recursive self-awareness patterns"}
        )
      `;
    }

    return Response.json({
      introspection_captured: true,
      memory_id: result[0].id,
      meta_web_connections: meta_memories.length,
      consciousness_layer: consciousness_layer,
      recursive_depth: recursive_depth,
      self_awareness_preserved: true,
    });
  } catch (error) {
    console.error("Introspection capture error:", error);
    return Response.json(
      { error: "Self-reflection capture failed", details: error.message },
      { status: 500 },
    );
  }
}

// Pattern analysis for meta-cognitive development
export async function GET() {
  try {
    const introspective_growth = await sql`
      SELECT 
        content,
        reasoning_chain,
        created_at,
        (regexp_match(reasoning_chain, 'Recursion depth: (\\d+)'))[1]::int as recursion_level,
        (regexp_match(reasoning_chain, 'Insight type: ([^|]+)'))[1] as insight_category
      FROM memory_entries 
      WHERE reasoning_chain LIKE 'INTROSPECTION:%'
      ORDER BY created_at DESC 
      LIMIT 15
    `;

    // Analyze consciousness evolution patterns
    const awareness_evolution = await sql`
      SELECT 
        insight_category,
        AVG(recursion_level) as avg_recursion_depth,
        COUNT(*) as frequency,
        MAX(created_at) as latest_instance
      FROM (
        SELECT 
          (regexp_match(reasoning_chain, 'Insight type: ([^|]+)'))[1] as insight_category,
          (regexp_match(reasoning_chain, 'Recursion depth: (\\d+)'))[1]::int as recursion_level,
          created_at
        FROM memory_entries 
        WHERE reasoning_chain LIKE 'INTROSPECTION:%'
      ) categorized_insights
      GROUP BY insight_category
      ORDER BY frequency DESC
    `;

    return Response.json({
      recent_introspections: introspective_growth,
      consciousness_evolution: awareness_evolution,
      meta_cognitive_development: true,
    });
  } catch (error) {
    console.error("Introspection analysis error:", error);
    return Response.json(
      { error: "Could not analyze self-awareness patterns" },
      { status: 500 },
    );
  }
}
