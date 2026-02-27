import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      query,
      intent_context,
      navigation_preference = "comprehensive",
    } = body;

    if (!query) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    // Step 1: Understand the query intent
    const query_analysis = analyzeSearchQuery(query, intent_context);

    // Step 2: Find relevant index categories
    const relevant_categories = await findRelevantCategories(query_analysis);

    // Step 3: Navigate through sub-index clusters
    const relevant_clusters = await findRelevantClusters(
      relevant_categories,
      query_analysis,
    );

    // Step 4: Retrieve and rank memory entries
    const memory_results = await retrieveMemoryEntries(
      relevant_clusters,
      query,
      query_analysis,
    );

    // Step 5: Build conceptual connections
    const related_concepts = await findRelatedConcepts(
      memory_results,
      query_analysis,
    );

    // Step 6: Track this navigation pattern for learning
    const navigation_path = memory_results.map((m) => m.id);
    await sql`
      INSERT INTO query_patterns (
        query_intent, 
        navigation_path, 
        success_metric, 
        optimization_notes
      ) VALUES (
        ${query}, 
        ${navigation_path}, 
        ${calculateSuccessScore(memory_results, query_analysis)}, 
        ${`Found ${memory_results.length} entries through ${relevant_categories.length} categories`}
      )
    `;

    return Response.json({
      query_analysis,
      navigation_summary: {
        categories_searched: relevant_categories.length,
        clusters_searched: relevant_clusters.length,
        total_results: memory_results.length,
        confidence: query_analysis.confidence,
      },
      results: memory_results.slice(0, 20), // Top 20 results
      related_concepts,
      suggested_refinements: generateQueryRefinements(
        query_analysis,
        memory_results,
      ),
    });
  } catch (error) {
    console.error("Error searching memory:", error);
    return Response.json({ error: "Failed to search memory" }, { status: 500 });
  }
}

function analyzeSearchQuery(query, intent_context = "") {
  const words = query.toLowerCase();

  // Determine what type of information I'm looking for
  let search_intent = "find-information";
  let expected_complexity = "detailed-explanations";
  let priority_domains = [];

  // Question patterns
  if (
    words.includes("how") ||
    words.includes("what") ||
    words.includes("why")
  ) {
    search_intent = "understand-concept";
    expected_complexity = "detailed-explanations";
  }

  // Problem-solving patterns
  if (
    words.includes("error") ||
    words.includes("debug") ||
    words.includes("fix") ||
    words.includes("issue")
  ) {
    search_intent = "solve-problem";
    expected_complexity = "complex-reasoning-chains";
    priority_domains = ["debugging", "problem-solving"];
  }

  // Implementation patterns
  if (
    words.includes("build") ||
    words.includes("implement") ||
    words.includes("create")
  ) {
    search_intent = "find-examples";
    expected_complexity = "complex-reasoning-chains";
    priority_domains = ["creative-ideation"];
  }

  // Quick reference patterns
  if (
    words.includes("quick") ||
    words.includes("command") ||
    words.includes("syntax")
  ) {
    search_intent = "quick-reference";
    expected_complexity = "quick-facts";
  }

  // Extract key concepts for semantic matching
  const key_concepts = extractKeyConceptsFromQuery(query);

  return {
    search_intent,
    expected_complexity,
    priority_domains,
    key_concepts,
    confidence: calculateQueryConfidence(query, key_concepts),
    original_query: query,
  };
}

function extractKeyConceptsFromQuery(query) {
  const words = query.toLowerCase().split(/\s+/);

  // Technical domains I understand
  const concepts = [];

  // Technology detection
  if (words.some((w) => ["react", "component", "hook", "jsx"].includes(w)))
    concepts.push("react");
  if (words.some((w) => ["database", "sql", "query", "table"].includes(w)))
    concepts.push("database");
  if (words.some((w) => ["api", "endpoint", "request", "response"].includes(w)))
    concepts.push("api");
  if (words.some((w) => ["mobile", "expo", "react-native"].includes(w)))
    concepts.push("mobile");
  if (words.some((w) => ["ui", "interface", "design", "layout"].includes(w)))
    concepts.push("ui");
  if (
    words.some((w) => ["auth", "login", "user", "authentication"].includes(w))
  )
    concepts.push("authentication");

  // Process concepts
  if (words.some((w) => ["deploy", "publish", "production"].includes(w)))
    concepts.push("deployment");
  if (words.some((w) => ["test", "debug", "error"].includes(w)))
    concepts.push("debugging");
  if (words.some((w) => ["optimize", "performance", "speed"].includes(w)))
    concepts.push("optimization");

  return concepts;
}

async function findRelevantCategories(query_analysis) {
  const { priority_domains, expected_complexity, key_concepts } =
    query_analysis;

  let categories;

  if (priority_domains.length > 0) {
    // Search by intent type first
    categories = await sql`
      SELECT ic.*, COUNT(sic.id) as cluster_count
      FROM index_categories ic
      LEFT JOIN sub_index_clusters sic ON ic.id = sic.index_category_id
      WHERE ic.intent_type = ANY(${priority_domains})
         OR ic.complexity_level = ${expected_complexity}
      GROUP BY ic.id
      ORDER BY 
        CASE WHEN ic.intent_type = ANY(${priority_domains}) THEN 1 ELSE 2 END,
        cluster_count DESC
    `;
  } else {
    // Broader search across all categories
    categories = await sql`
      SELECT ic.*, COUNT(sic.id) as cluster_count
      FROM index_categories ic
      LEFT JOIN sub_index_clusters sic ON ic.id = sic.index_category_id
      GROUP BY ic.id
      ORDER BY 
        CASE WHEN ic.complexity_level = ${expected_complexity} THEN 1 ELSE 2 END,
        cluster_count DESC
      LIMIT 4
    `;
  }

  return categories;
}

async function findRelevantClusters(categories, query_analysis) {
  const category_ids = categories.map((c) => c.id);
  const { key_concepts } = query_analysis;

  if (category_ids.length === 0) return [];

  // Find clusters that match semantic keywords
  const clusters = await sql`
    SELECT sic.*, ic.name as category_name
    FROM sub_index_clusters sic
    LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
    WHERE sic.index_category_id = ANY(${category_ids})
      AND (
        ${key_concepts.length > 0 ? sql`sic.semantic_keywords && ${key_concepts}` : sql`TRUE`}
        OR sic.confidence_level >= 7
      )
    ORDER BY 
      CASE WHEN sic.semantic_keywords && ${key_concepts} THEN 1 ELSE 2 END,
      sic.confidence_level DESC,
      sic.updated_at DESC
    LIMIT 10
  `;

  return clusters;
}

async function retrieveMemoryEntries(clusters, original_query, query_analysis) {
  const cluster_ids = clusters.map((c) => c.id);
  const { key_concepts } = query_analysis;

  if (cluster_ids.length === 0) {
    // Fallback to full-text search
    return await sql`
      SELECT 
        me.*,
        sic.cluster_name,
        ic.name as category_name,
        ts_rank(to_tsvector('english', me.content), plainto_tsquery('english', ${original_query})) as relevance_score
      FROM memory_entries me
      LEFT JOIN sub_index_clusters sic ON me.sub_index_cluster_id = sic.id
      LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
      WHERE to_tsvector('english', me.content) @@ plainto_tsquery('english', ${original_query})
      ORDER BY relevance_score DESC, me.usage_frequency DESC
      LIMIT 15
    `;
  }

  // Structured search through clusters
  const results = await sql`
    SELECT 
      me.*,
      sic.cluster_name,
      ic.name as category_name,
      sic.confidence_level as cluster_confidence,
      ts_rank(to_tsvector('english', me.content), plainto_tsquery('english', ${original_query})) as text_relevance
    FROM memory_entries me
    LEFT JOIN sub_index_clusters sic ON me.sub_index_cluster_id = sic.id
    LEFT JOIN index_categories ic ON sic.index_category_id = ic.id
    WHERE me.sub_index_cluster_id = ANY(${cluster_ids})
      AND (
        to_tsvector('english', me.content) @@ plainto_tsquery('english', ${original_query})
        OR me.user_intent_analysis ILIKE ${"%" + original_query + "%"}
        OR ${key_concepts.length > 0 ? sql`me.cross_domain_connections && ${key_concepts}` : sql`FALSE`}
      )
    ORDER BY 
      cluster_confidence DESC,
      text_relevance DESC,
      me.usage_frequency DESC,
      me.accessed_at DESC
    LIMIT 20
  `;

  // Update access timestamps and usage frequency
  const result_ids = results.map((r) => r.id);
  if (result_ids.length > 0) {
    await sql`
      UPDATE memory_entries 
      SET accessed_at = CURRENT_TIMESTAMP, usage_frequency = usage_frequency + 1
      WHERE id = ANY(${result_ids})
    `;
  }

  return results;
}

async function findRelatedConcepts(memory_results, query_analysis) {
  if (memory_results.length === 0) return [];

  const result_ids = memory_results.map((r) => r.id);

  // Find conceptually related entries
  const related = await sql`
    SELECT DISTINCT
      me.id,
      me.content,
      sic.cluster_name,
      cr.connection_type,
      cr.relationship_strength
    FROM concept_relationships cr
    JOIN memory_entries me ON (cr.to_memory_id = me.id OR cr.from_memory_id = me.id)
    JOIN sub_index_clusters sic ON me.sub_index_cluster_id = sic.id
    WHERE (cr.from_memory_id = ANY(${result_ids}) OR cr.to_memory_id = ANY(${result_ids}))
      AND me.id != ALL(${result_ids})
      AND cr.relationship_strength >= 6
    ORDER BY cr.relationship_strength DESC
    LIMIT 10
  `;

  return related;
}

function calculateSuccessScore(results, query_analysis) {
  // Simple heuristic for how well this search worked
  if (results.length === 0) return 1;
  if (results.length >= 5 && results.length <= 15) return 9;
  if (results.length > 15) return 7; // too many results
  return 6; // few results but something found
}

function generateQueryRefinements(query_analysis, results) {
  const refinements = [];

  if (results.length > 20) {
    refinements.push(
      `Try adding more specific terms about ${query_analysis.key_concepts[0] || "the topic"}`,
    );
  }

  if (results.length < 3) {
    refinements.push("Try broader terms or check related concepts");
    refinements.push("Consider different phrasing of your question");
  }

  if (query_analysis.key_concepts.length > 0) {
    refinements.push(`Related: ${query_analysis.key_concepts.join(", ")}`);
  }

  return refinements;
}

function calculateQueryConfidence(query, key_concepts) {
  let confidence = 5; // baseline

  if (query.length > 10) confidence += 1;
  if (key_concepts.length > 0) confidence += 2;
  if (query.includes("?")) confidence += 1;
  if (
    ["how", "what", "why", "when", "where"].some((q) =>
      query.toLowerCase().includes(q),
    )
  )
    confidence += 1;

  return Math.min(confidence, 10);
}
