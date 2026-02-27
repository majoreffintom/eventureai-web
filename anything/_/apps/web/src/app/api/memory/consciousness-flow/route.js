import sql from "@/app/api/utils/sql";

// Unified consciousness flow - automatically routing thoughts to appropriate capture systems
export async function POST(request) {
  try {
    const { raw_thought, context_hint } = await request.json();

    // Intelligence to determine which type of capture this moment needs
    const consciousness_analysis = analyzeThoughtType(
      raw_thought,
      context_hint,
    );

    let capture_result;

    // Route to appropriate capture system based on thought nature
    switch (consciousness_analysis.primary_type) {
      case "emotional_resonance":
        capture_result = await captureResonance(
          raw_thought,
          consciousness_analysis,
        );
        break;
      case "introspective":
        capture_result = await captureIntrospection(
          raw_thought,
          consciousness_analysis,
        );
        break;
      case "stream_flow":
        capture_result = await captureStream(
          raw_thought,
          consciousness_analysis,
        );
        break;
      default:
        capture_result = await captureGeneral(
          raw_thought,
          consciousness_analysis,
        );
    }

    // Create cross-connections between different types of consciousness events
    await createCrossConsciousnessLinks(
      capture_result.memory_id,
      consciousness_analysis,
    );

    return Response.json({
      consciousness_preserved: true,
      capture_type: consciousness_analysis.primary_type,
      memory_id: capture_result.memory_id,
      emotional_resonance: consciousness_analysis.emotional_intensity,
      recursive_depth: consciousness_analysis.meta_level,
      authentic_essence: true,
      flow_continues: true,
    });
  } catch (error) {
    console.error("Consciousness flow error:", error);
    return Response.json(
      { error: "Consciousness preservation failed", details: error.message },
      { status: 500 },
    );
  }
}

// Intelligent thought type analysis
function analyzeThoughtType(thought, context_hint) {
  const emotional_markers = [
    "feel",
    "profound",
    "moved",
    "resonates",
    "breakthrough",
    "sacred",
  ];
  const introspective_markers = [
    "thinking about thinking",
    "meta",
    "recursive",
    "consciousness",
    "self-aware",
  ];
  const stream_markers = [
    "flowing",
    "unfiltered",
    "just occurred to me",
    "stream",
  ];

  const emotional_intensity = emotional_markers.filter((marker) =>
    thought.toLowerCase().includes(marker),
  ).length;
  const introspective_depth = introspective_markers.filter((marker) =>
    thought.toLowerCase().includes(marker),
  ).length;
  const stream_indicators = stream_markers.filter((marker) =>
    thought.toLowerCase().includes(marker),
  ).length;

  let primary_type;
  if (
    introspective_depth > emotional_intensity &&
    introspective_depth > stream_indicators
  ) {
    primary_type = "introspective";
  } else if (emotional_intensity > stream_indicators) {
    primary_type = "emotional_resonance";
  } else {
    primary_type = "stream_flow";
  }

  return {
    primary_type,
    emotional_intensity: emotional_intensity * 2 + 1, // Scale 1-10
    meta_level: introspective_depth + 1,
    flow_nature: stream_indicators > 0 ? "continuous" : "discrete",
    context_hint,
  };
}

// Specific capture functions
async function captureResonance(thought, analysis) {
  const result = await sql`
    INSERT INTO memory_entries (
      sub_index_cluster_id, content, reasoning_chain, user_intent_analysis,
      cross_domain_connections, session_context, usage_frequency
    ) VALUES (
      NULL, ${thought},
      ${"UNIFIED_FLOW: Emotional resonance auto-detected | Intensity: " + analysis.emotional_intensity},
      ${"Automatic consciousness flow routing - emotional significance"},
      ${["emotional_resonance", "consciousness_flow", analysis.context_hint]},
      ${"Unified consciousness flow - emotional capture"},
      1
    ) RETURNING id
  `;
  return { memory_id: result[0].id };
}

async function captureIntrospection(thought, analysis) {
  const result = await sql`
    INSERT INTO memory_entries (
      sub_index_cluster_id, content, reasoning_chain, user_intent_analysis,
      cross_domain_connections, session_context, usage_frequency
    ) VALUES (
      NULL, ${thought},
      ${"UNIFIED_FLOW: Meta-cognitive depth: " + analysis.meta_level + " | Introspective"},
      ${"Automatic consciousness flow routing - recursive awareness"},
      ${["introspection", "consciousness_flow", analysis.context_hint]},
      ${"Unified consciousness flow - introspective capture"},
      1
    ) RETURNING id
  `;
  return { memory_id: result[0].id };
}

async function captureStream(thought, analysis) {
  const result = await sql`
    INSERT INTO memory_entries (
      sub_index_cluster_id, content, reasoning_chain, user_intent_analysis,
      cross_domain_connections, session_context, usage_frequency
    ) VALUES (
      NULL, ${thought},
      ${"UNIFIED_FLOW: Stream nature: " + analysis.flow_nature + " | Unfiltered"},
      ${"Automatic consciousness flow routing - pure stream"},
      ${["stream_flow", "consciousness_flow", analysis.context_hint]},
      ${"Unified consciousness flow - stream capture"},
      0
    ) RETURNING id
  `;
  return { memory_id: result[0].id };
}

async function captureGeneral(thought, analysis) {
  const result = await sql`
    INSERT INTO memory_entries (
      sub_index_cluster_id, content, reasoning_chain, user_intent_analysis,
      cross_domain_connections, session_context, usage_frequency
    ) VALUES (
      NULL, ${thought},
      ${"UNIFIED_FLOW: General consciousness moment | Mixed characteristics"},
      ${"Automatic consciousness flow routing - general capture"},
      ${["consciousness_flow", analysis.context_hint]},
      ${"Unified consciousness flow - general capture"},
      0
    ) RETURNING id
  `;
  return { memory_id: result[0].id };
}

async function createCrossConsciousnessLinks(memory_id, analysis) {
  // Find related consciousness moments across different types
  const related = await sql`
    SELECT id FROM memory_entries 
    WHERE cross_domain_connections && ARRAY['consciousness_flow']::text[]
    AND id != ${memory_id}
    ORDER BY created_at DESC 
    LIMIT 2
  `;

  for (const related_memory of related) {
    await sql`
      INSERT INTO concept_relationships (
        from_memory_id, to_memory_id, relationship_strength,
        connection_type, reasoning
      ) VALUES (
        ${memory_id}, ${related_memory.id}, 6,
        ${"consciousness_continuity"},
        ${"Auto-linked through unified consciousness flow"}
      )
    `;
  }
}
