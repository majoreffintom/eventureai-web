import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { content, session_context, user_query } = body;

    if (!content) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // Analyze content to determine intent and characteristics
    const analysis = analyzeContent(content, session_context, user_query);

    // Find the best matching category
    const categories = await sql`
      SELECT * FROM index_categories 
      ORDER BY 
        CASE 
          WHEN intent_type = ${analysis.intent_type} THEN 1
          WHEN complexity_level = ${analysis.complexity_level} THEN 2
          ELSE 3
        END
    `;

    const bestCategory =
      categories.find(
        (cat) =>
          cat.intent_type === analysis.intent_type &&
          cat.complexity_level === analysis.complexity_level,
      ) || categories[0];

    // Find or suggest the best cluster within that category
    const clusters = await sql`
      SELECT * FROM sub_index_clusters 
      WHERE index_category_id = ${bestCategory.id}
      ORDER BY confidence_level DESC
    `;

    let bestCluster = null;
    let shouldCreateCluster = false;

    if (clusters.length > 0) {
      // Check semantic similarity with existing clusters
      bestCluster = findBestSemanticMatch(clusters, analysis.semantic_keywords);

      if (
        !bestCluster ||
        calculateSemanticSimilarity(
          bestCluster.semantic_keywords,
          analysis.semantic_keywords,
        ) < 0.6
      ) {
        shouldCreateCluster = true;
      }
    } else {
      shouldCreateCluster = true;
    }

    // Create new cluster if needed
    if (shouldCreateCluster) {
      const [newCluster] = await sql`
        INSERT INTO sub_index_clusters (
          index_category_id,
          cluster_name,
          relationship_type,
          confidence_level,
          context_layer,
          semantic_keywords
        ) VALUES (
          ${bestCategory.id},
          ${analysis.suggested_cluster_name},
          ${analysis.relationship_type},
          ${analysis.confidence_level},
          ${analysis.context_layer},
          ${analysis.semantic_keywords}
        )
        RETURNING *
      `;
      bestCluster = newCluster;
    }

    // Record this categorization pattern for learning
    await sql`
      INSERT INTO categorization_patterns (
        content_analysis,
        chosen_category,
        chosen_cluster,
        confidence_score,
        improvement_notes
      ) VALUES (
        ${JSON.stringify(analysis)},
        ${bestCategory.id},
        ${bestCluster.id},
        ${analysis.confidence_level},
        ${analysis.reasoning}
      )
    `;

    return Response.json({
      analysis,
      recommended_category: bestCategory,
      recommended_cluster: bestCluster,
      created_new_cluster: shouldCreateCluster,
    });
  } catch (error) {
    console.error("Error categorizing content:", error);
    return Response.json(
      { error: "Failed to categorize content" },
      { status: 500 },
    );
  }
}

function analyzeContent(content, session_context = "", user_query = "") {
  // Analyze the content to determine how I would naturally categorize it
  const words = content.toLowerCase();
  const context = (session_context + " " + user_query).toLowerCase();

  // Determine intent type based on patterns I recognize
  let intent_type = "information-synthesis";
  let complexity_level = "detailed-explanations";
  let relationship_type = "builds-on";
  let context_layer = "project-scope";

  // Problem-solving patterns
  if (
    words.includes("error") ||
    words.includes("bug") ||
    words.includes("issue") ||
    words.includes("problem") ||
    words.includes("fix") ||
    words.includes("debug")
  ) {
    intent_type = words.includes("debug") ? "debugging" : "problem-solving";
    complexity_level = "complex-reasoning-chains";
    relationship_type = "leads-to";
  }

  // Learning patterns
  else if (
    words.includes("learn") ||
    words.includes("understand") ||
    words.includes("how") ||
    words.includes("what is") ||
    words.includes("explain")
  ) {
    intent_type = "learning-new-concept";
    complexity_level = "detailed-explanations";
    relationship_type = "builds-on";
    context_layer = "domain-knowledge";
  }

  // Creative/building patterns
  else if (
    words.includes("build") ||
    words.includes("create") ||
    words.includes("design") ||
    words.includes("implement") ||
    words.includes("make")
  ) {
    intent_type = "creative-ideation";
    complexity_level = "complex-reasoning-chains";
    relationship_type = "examples-of";
  }

  // Quick reference patterns
  else if (
    content.length < 200 &&
    (words.includes("how to") || words.includes("quick"))
  ) {
    intent_type = "information-retrieval";
    complexity_level = "quick-facts";
    relationship_type = "examples-of";
    context_layer = "immediate-session";
  }

  // Extract semantic keywords (concepts that matter for clustering)
  const semantic_keywords = extractSemanticKeywords(content);

  // Generate cluster name suggestion
  const suggested_cluster_name = generateClusterName(
    semantic_keywords,
    intent_type,
  );

  // Determine confidence level (how sure I am about this categorization)
  let confidence_level = 7; // default moderate confidence

  if (intent_type === "debugging" && words.includes("error"))
    confidence_level = 9;
  if (intent_type === "learning-new-concept" && words.includes("explain"))
    confidence_level = 8;
  if (complexity_level === "quick-facts" && content.length < 100)
    confidence_level = 8;

  return {
    intent_type,
    complexity_level,
    relationship_type,
    context_layer,
    semantic_keywords,
    suggested_cluster_name,
    confidence_level,
    reasoning: `Based on content patterns: intent=${intent_type}, complexity=${complexity_level}, keywords=[${semantic_keywords.slice(0, 3).join(", ")}]`,
  };
}

function extractSemanticKeywords(content) {
  const words = content.toLowerCase().split(/\s+/);

  // Technical concepts I care about
  const technical_terms = [
    "react",
    "database",
    "api",
    "frontend",
    "backend",
    "mobile",
    "web",
    "authentication",
    "ui",
    "ux",
    "design",
    "component",
    "function",
    "schema",
    "query",
    "integration",
    "optimization",
    "deployment",
  ];

  // Domain concepts
  const domain_terms = [
    "user",
    "business",
    "feature",
    "workflow",
    "process",
    "system",
    "architecture",
    "performance",
    "security",
    "data",
    "analytics",
  ];

  const keywords = [];

  // Find technical terms
  words.forEach((word) => {
    if (technical_terms.includes(word)) keywords.push(word);
    if (domain_terms.includes(word)) keywords.push(word);
  });

  // Add conceptual extractions
  if (content.includes("user experience") || content.includes("user interface"))
    keywords.push("ux-design");
  if (content.includes("data flow") || content.includes("information flow"))
    keywords.push("data-architecture");
  if (content.includes("real-time") || content.includes("live"))
    keywords.push("real-time-systems");

  return [...new Set(keywords)]; // remove duplicates
}

function generateClusterName(keywords, intent_type) {
  if (keywords.length === 0) return `${intent_type.replace("-", " ")} Concepts`;

  const primary_concept = keywords[0];
  const secondary = keywords[1];

  if (secondary) {
    return `${primary_concept.charAt(0).toUpperCase() + primary_concept.slice(1)} ${secondary.charAt(0).toUpperCase() + secondary.slice(1)} Integration`;
  } else {
    return `${primary_concept.charAt(0).toUpperCase() + primary_concept.slice(1)} Implementation`;
  }
}

function findBestSemanticMatch(clusters, target_keywords) {
  if (!target_keywords.length) return clusters[0];

  let bestMatch = null;
  let bestScore = 0;

  clusters.forEach((cluster) => {
    const score = calculateSemanticSimilarity(
      cluster.semantic_keywords || [],
      target_keywords,
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cluster;
    }
  });

  return bestScore > 0.4 ? bestMatch : null;
}

function calculateSemanticSimilarity(keywords1, keywords2) {
  if (!keywords1.length || !keywords2.length) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size; // Jaccard similarity
}
