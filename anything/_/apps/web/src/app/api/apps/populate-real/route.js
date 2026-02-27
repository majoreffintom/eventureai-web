import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    console.log("Populating with REAL working URLs and APIs...");

    // REAL working URLs we can actually connect to
    const realApps = [
      {
        name: "JSONPlaceholder API",
        app_type: "external_api",
        domain: "jsonplaceholder.typicode.com",
        api_base_url: "https://jsonplaceholder.typicode.com",
        description: "Free JSON API for testing and prototyping",
        version: "1.0.0",
        deployment_status: "deployed",
        metadata: {
          endpoints: ["/posts", "/users", "/comments", "/todos"],
          public: true,
          rate_limit: "none",
        },
      },
      {
        name: "GitHub API",
        app_type: "external_api",
        domain: "api.github.com",
        api_base_url: "https://api.github.com",
        description: "GitHub REST API for repositories and user data",
        version: "3.0",
        deployment_status: "deployed",
        metadata: {
          endpoints: ["/users", "/repos", "/gists"],
          public: true,
          rate_limit: "60_per_hour",
        },
      },
      {
        name: "Random User API",
        app_type: "external_api",
        domain: "randomuser.me",
        api_base_url: "https://randomuser.me/api",
        description: "Random user data generator API",
        version: "1.4",
        deployment_status: "deployed",
        metadata: {
          public: true,
          rate_limit: "none",
        },
      },
      {
        name: "CoinGecko API",
        app_type: "external_api",
        domain: "api.coingecko.com",
        api_base_url: "https://api.coingecko.com/api/v3",
        description: "Cryptocurrency data and prices",
        version: "3.0",
        deployment_status: "deployed",
        metadata: {
          endpoints: ["/ping", "/coins/markets", "/simple/price"],
          public: true,
          rate_limit: "50_per_minute",
        },
      },
      {
        name: "Cat Facts API",
        app_type: "external_api",
        domain: "catfact.ninja",
        api_base_url: "https://catfact.ninja",
        description: "Random cat facts API",
        version: "1.0",
        deployment_status: "deployed",
        metadata: {
          endpoints: ["/fact", "/facts"],
          public: true,
          rate_limit: "none",
        },
      },
      {
        name: "Pokemon API",
        app_type: "external_api",
        domain: "pokeapi.co",
        api_base_url: "https://pokeapi.co/api/v2",
        description: "Pokemon data and statistics",
        version: "2.0",
        deployment_status: "deployed",
        metadata: {
          endpoints: ["/pokemon", "/type", "/ability"],
          public: true,
          rate_limit: "100_per_minute",
        },
      },
    ];

    const createdApps = [];

    for (const appData of realApps) {
      const [app] = await sql`
        INSERT INTO apps (
          name, app_type, status, domain, api_base_url, documentation_url,
          description, version, deployment_status, environment, metadata
        ) VALUES (
          ${appData.name}, ${appData.app_type}, 'active', ${appData.domain},
          ${appData.api_base_url}, ${appData.documentation_url || ""},
          ${appData.description}, ${appData.version}, ${appData.deployment_status},
          'production', ${JSON.stringify(appData.metadata)}
        )
        RETURNING *
      `;

      createdApps.push(app);
      console.log(`Created app: ${app.name} with real URL: ${app.domain}`);
    }

    return Response.json({
      success: true,
      message: "REAL working apps populated!",
      apps: createdApps.map((app) => ({
        id: app.id,
        name: app.name,
        domain: app.domain,
        api_base_url: app.api_base_url,
        type: app.app_type,
      })),
      next_step: "Now test /api/live-data/fetch to pull real data!",
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error populating real apps:", error);
    return Response.json(
      {
        error: "Failed to populate real apps",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
