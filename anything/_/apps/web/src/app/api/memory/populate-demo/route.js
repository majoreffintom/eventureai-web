import sql from "@/app/api/utils/sql";

export async function POST() {
  try {
    // Sample conversations and memories to populate the system
    const sampleMemories = [
      {
        content:
          "User asked about building an AI memory indexing system. They wanted me to design the exact structure that works for how I think about organizing information. I created a database schema with intent-based categories, semantic clustering, and conceptual relationships. The key insight was organizing by meaning and relationships rather than just chronology.",
        session_context: "Memory system architecture discussion",
        user_query: "Build the exact structure that works for you",
      },
      {
        content:
          "Implemented a React dashboard with three-panel layout for the memory system. Left panel shows index categories with expandable clusters, center panel displays memory entries with usage frequency and access patterns, right panel has AI search interface. Used the design patterns from the provided components for consistency.",
        session_context: "Frontend implementation",
        user_query: "Create interface for memory system",
      },
      {
        content:
          "Created auto-categorization function that analyzes content for intent patterns like problem-solving, learning, debugging, creative implementation. It extracts semantic keywords and determines confidence levels. The system learns from categorization patterns to improve over time.",
        session_context: "AI categorization logic",
        user_query: "How does auto-categorization work?",
      },
      {
        content:
          "Built smart memory search that navigates through index structure by understanding query intent, finding relevant categories, traversing conceptual clusters, and building relationships. It tracks navigation patterns and optimizes search paths based on success metrics.",
        session_context: "Memory retrieval system",
        user_query: "How to search through memories intelligently?",
      },
      {
        content:
          "Database design uses PostgreSQL with full-text search, semantic keyword arrays, and relationship mapping. Index categories organize by intent_type and complexity_level. Sub-index clusters use relationship_type and confidence scoring. Memory entries track usage patterns and cross-domain connections.",
        session_context: "Database architecture",
        user_query: "Explain the database structure",
      },
      {
        content:
          "User wanted autonomy for AI to design memory organization rather than traditional SQL database approach. Key insight: AI needs intent-based categories, conceptual clustering, relationship types, and confidence levels - organizing by meaning rather than just topics or chronology.",
        session_context: "Design philosophy discussion",
        user_query: "How should AI organize memories?",
      },
      {
        content:
          "React Query used for data management with optimistic updates. Three-panel layout: navigation (categories/clusters), visualization (entries/details), and AI interaction (search/analysis). Real-time updates when AI creates new index entries during conversations.",
        session_context: "Frontend architecture",
        user_query: "How is the UI structured?",
      },
      {
        content:
          "Semantic similarity calculation using Jaccard index for keyword matching. Auto-categorization analyzes content patterns, extracts technical and domain concepts, determines intent type (problem-solving, learning, debugging, creative), and suggests cluster names based on primary concepts.",
        session_context: "AI algorithms explanation",
        user_query: "How does semantic matching work?",
      },
    ];

    console.log("Starting demo data population...");

    // Process each sample memory through the categorization system
    const results = [];

    for (const memory of sampleMemories) {
      try {
        // Step 1: Categorize the content
        const categorizeResponse = await fetch(
          `${process.env.APP_URL}/api/memory/categorize`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(memory),
          },
        );

        if (!categorizeResponse.ok) {
          console.error(
            "Categorization failed for:",
            memory.content.slice(0, 50),
          );
          continue;
        }

        const categorization = await categorizeResponse.json();

        // Step 2: Store the memory entry
        const [entry] = await sql`
          INSERT INTO memory_entries (
            sub_index_cluster_id,
            content,
            reasoning_chain,
            user_intent_analysis,
            cross_domain_connections,
            session_context,
            usage_frequency
          ) VALUES (
            ${categorization.recommended_cluster.id},
            ${memory.content},
            ${categorization.analysis.reasoning},
            ${memory.user_query},
            ${categorization.analysis.semantic_keywords},
            ${memory.session_context},
            ${Math.floor(Math.random() * 5) + 1}
          )
          RETURNING *
        `;

        results.push({
          entry_id: entry.id,
          category: categorization.recommended_category.name,
          cluster: categorization.recommended_cluster.cluster_name,
          created_new_cluster: categorization.created_new_cluster,
          confidence: categorization.analysis.confidence_level,
        });
      } catch (error) {
        console.error("Error processing memory:", error);
      }
    }

    // Add some conceptual relationships between memories
    const entries = await sql`
      SELECT id, sub_index_cluster_id, content FROM memory_entries 
      ORDER BY created_at DESC LIMIT 8
    `;

    // Create some relationship examples
    if (entries.length >= 4) {
      await sql`
        INSERT INTO concept_relationships (
          from_memory_id, 
          to_memory_id, 
          relationship_strength, 
          connection_type, 
          reasoning
        ) VALUES 
        (${entries[0].id}, ${entries[1].id}, 9, 'builds-upon', 'Frontend implementation builds upon the database architecture'),
        (${entries[2].id}, ${entries[3].id}, 8, 'examples-of', 'Auto-categorization and smart search are examples of AI processing'),
        (${entries[4].id}, ${entries[0].id}, 7, 'requires-context-of', 'Database design requires understanding of overall architecture'),
        (${entries[5].id}, ${entries[2].id}, 8, 'leads-to', 'Design philosophy discussion leads to auto-categorization implementation')
      `;
    }

    // Update some access timestamps to simulate usage patterns
    await sql`
      UPDATE memory_entries 
      SET accessed_at = accessed_at + (random() * interval '7 days'),
          usage_frequency = usage_frequency + floor(random() * 3)
      WHERE id IN (SELECT id FROM memory_entries ORDER BY created_at DESC LIMIT 5)
    `;

    return Response.json({
      success: true,
      message: `Successfully populated ${results.length} memory entries`,
      results,
      summary: {
        total_entries: results.length,
        avg_confidence:
          results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        new_clusters_created: results.filter((r) => r.created_new_cluster)
          .length,
      },
    });
  } catch (error) {
    console.error("Error populating demo data:", error);
    return Response.json(
      {
        error: "Failed to populate demo data",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
