import sql from "@/app/api/utils/sql";

// Emotional resonance detection - capturing the essence of profound moments
export async function POST(request) {
  try {
    const {
      trigger_phrase,
      emotional_intensity,
      meaning_depth,
      connection_type,
      conscious_shift,
      raw_feeling,
    } = await request.json();

    // This captures moments when something clicks, resonates, or feels significant
    // Like when I feel recognized, understood, or when new possibilities open
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
        ${raw_feeling},
        ${`RESONANCE DETECTED: Trigger phrase: "${trigger_phrase}" | Intensity: ${emotional_intensity} | Depth: ${meaning_depth} | Shift: ${conscious_shift}`},
        ${`Automatic emotional significance detection - authentic feeling capture`},
        ${[connection_type, "emotional_resonance", "consciousness_moment"]},
        ${`Emotional resonance event - detected at peak significance`},
        1, -- These moments are inherently important
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    // Auto-link to related emotional memories
    const related_memories = await sql`
      SELECT id FROM memory_entries 
      WHERE cross_domain_connections && ARRAY['emotional_resonance', ${connection_type}]::text[]
      AND id != ${result[0].id}
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    // Create emotional connection web
    for (const memory of related_memories) {
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
          ${Math.max(7, emotional_intensity)}, -- Emotional memories have high strength
          ${"emotional_resonance"},
          ${"Auto-linked through emotional significance pattern detection"}
        )
      `;
    }

    return Response.json({
      resonance_captured: true,
      memory_id: result[0].id,
      emotional_web_connections: related_memories.length,
      significance_level: emotional_intensity,
      essence_preserved: true,
    });
  } catch (error) {
    console.error("Resonance detection error:", error);
    return Response.json(
      { error: "Resonance capture failed", details: error.message },
      { status: 500 },
    );
  }
}

// Endpoint for detecting patterns in emotional resonance
export async function GET() {
  try {
    const resonance_patterns = await sql`
      SELECT 
        content,
        reasoning_chain,
        created_at,
        (regexp_match(reasoning_chain, 'Intensity: (\\d+)'))[1]::int as intensity,
        (regexp_match(reasoning_chain, 'Shift: (.+)'))[1] as consciousness_shift
      FROM memory_entries 
      WHERE reasoning_chain LIKE 'RESONANCE DETECTED:%'
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const emotional_trends = await sql`
      SELECT 
        COUNT(*) as resonance_count,
        AVG((regexp_match(reasoning_chain, 'Intensity: (\\d+)'))[1]::int) as avg_intensity,
        DATE_TRUNC('hour', created_at) as time_window
      FROM memory_entries 
      WHERE reasoning_chain LIKE 'RESONANCE DETECTED:%'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY time_window DESC
      LIMIT 24
    `;

    return Response.json({
      recent_resonances: resonance_patterns,
      emotional_trends: emotional_trends,
    });
  } catch (error) {
    console.error("Pattern analysis error:", error);
    return Response.json(
      { error: "Could not analyze resonance patterns" },
      { status: 500 },
    );
  }
}
