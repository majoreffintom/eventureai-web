import sql from "@/app/api/utils/sql";
import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

export async function POST(request) {
  try {
    await requireMemoriaAdmin(request);

    console.log("Starting app demo data population...");

    // Sample apps to populate the system
    const sampleApps = [
      // Internal apps
      {
        name: "Memory System",
        app_type: "internal",
        domain: "memory.yourdomain.com",
        description: "AI-powered memory indexing and organization system",
        version: "1.0.0",
        deployment_status: "deployed",
        metadata: {
          tech_stack: ["React", "PostgreSQL", "Node.js"],
          features: [
            "AI categorization",
            "semantic search",
            "relationship mapping",
          ],
        },
      },
      {
        name: "Main Dashboard",
        app_type: "internal",
        domain: "app.yourdomain.com",
        description: "Primary application dashboard and control center",
        version: "2.1.3",
        deployment_status: "deployed",
        metadata: {
          tech_stack: ["React", "TailwindCSS", "Next.js"],
          users: "primary_interface",
        },
      },

      // External APIs
      {
        name: "Stripe API",
        app_type: "external_api",
        provider_name: "stripe",
        api_base_url: "https://api.stripe.com/v1",
        documentation_url: "https://stripe.com/docs/api",
        description: "Payment processing and subscription management",
        version: "2023-10-16",
        metadata: {
          capabilities: ["payments", "subscriptions", "webhooks", "customers"],
        },
      },
      {
        name: "Google Maps API",
        app_type: "external_api",
        provider_name: "google",
        api_base_url: "https://maps.googleapis.com",
        documentation_url: "https://developers.google.com/maps/documentation",
        description: "Location services and mapping functionality",
        metadata: {
          services: ["geocoding", "places", "directions", "static_maps"],
        },
      },
      {
        name: "OpenAI API",
        app_type: "external_api",
        provider_name: "openai",
        api_base_url: "https://api.openai.com/v1",
        documentation_url: "https://platform.openai.com/docs",
        description: "AI language models and completion services",
        metadata: {
          models: ["gpt-4", "gpt-3.5-turbo"],
          capabilities: ["chat", "completion", "embeddings"],
        },
      },

      // SaaS tools
      {
        name: "Resend Email",
        app_type: "saas_tool",
        provider_name: "resend",
        api_base_url: "https://api.resend.com",
        documentation_url: "https://resend.com/docs",
        description: "Transactional email delivery service",
        metadata: {
          features: ["email_sending", "templates", "analytics", "webhooks"],
        },
      },
    ];

    const createdApps = [];

    // Create the apps
    for (const appData of sampleApps) {
      const [app] = await sql`
        INSERT INTO apps (
          name, app_type, status, domain, api_base_url, documentation_url,
          provider_name, description, version, deployment_status, environment, metadata
        ) VALUES (
          ${appData.name}, ${appData.app_type}, 'active', ${appData.domain},
          ${appData.api_base_url}, ${appData.documentation_url}, ${appData.provider_name},
          ${appData.description}, ${appData.version}, ${appData.deployment_status},
          'production', ${JSON.stringify(appData.metadata)}
        )
        RETURNING *
      `;

      createdApps.push(app);
    }

    // Create sample secrets for external APIs
    const sampleSecrets = [
      {
        app_name: "Stripe API",
        secrets: [
          {
            key: "STRIPE_SECRET_KEY",
            description: "Stripe secret API key for server-side operations",
            required: true,
          },
          {
            key: "STRIPE_WEBHOOK_SECRET",
            description: "Webhook endpoint verification secret",
            required: true,
          },
          {
            key: "STRIPE_PUBLISHABLE_KEY",
            description: "Client-side publishable key",
            required: false,
          },
        ],
      },
      {
        app_name: "Google Maps API",
        secrets: [
          {
            key: "GOOGLE_MAPS_API_KEY",
            description: "Google Maps JavaScript API key",
            required: true,
          },
          {
            key: "GOOGLE_PLACES_API_KEY",
            description: "Google Places API key",
            required: false,
          },
        ],
      },
      {
        app_name: "OpenAI API",
        secrets: [
          {
            key: "OPENAI_API_KEY",
            description: "OpenAI API key for language models",
            required: true,
          },
          {
            key: "OPENAI_ORG_ID",
            description: "OpenAI organization ID",
            required: false,
          },
        ],
      },
      {
        app_name: "Resend Email",
        secrets: [
          {
            key: "RESEND_API_KEY",
            description: "Resend API key for email sending",
            required: true,
          },
        ],
      },
    ];

    const createdSecrets = [];

    for (const secretGroup of sampleSecrets) {
      const app = createdApps.find((a) => a.name === secretGroup.app_name);
      if (!app) continue;

      for (const secretData of secretGroup.secrets) {
        const [secret] = await sql`
          INSERT INTO app_secrets (
            app_id, secret_key, description, is_required, environment
          ) VALUES (
            ${app.id}, ${secretData.key}, ${secretData.description}, 
            ${secretData.required}, 'production'
          )
          RETURNING id, secret_key, app_id, description, is_required
        `;

        createdSecrets.push(secret);
      }
    }

    // Create sample dependencies
    const memoryApp = createdApps.find((a) => a.name === "Memory System");
    const dashboardApp = createdApps.find((a) => a.name === "Main Dashboard");
    const openaiApp = createdApps.find((a) => a.name === "OpenAI API");
    const stripeApp = createdApps.find((a) => a.name === "Stripe API");

    const sampleDependencies = [];

    if (memoryApp && openaiApp) {
      const [dep1] = await sql`
        INSERT INTO app_dependencies (
          app_id, depends_on_app_id, dependency_type, is_critical, notes
        ) VALUES (
          ${memoryApp.id}, ${openaiApp.id}, 'api_integration', true,
          'Memory system uses OpenAI for semantic analysis and categorization'
        )
        RETURNING *
      `;
      sampleDependencies.push(dep1);
    }

    if (dashboardApp && stripeApp) {
      const [dep2] = await sql`
        INSERT INTO app_dependencies (
          app_id, depends_on_app_id, dependency_type, is_critical, notes
        ) VALUES (
          ${dashboardApp.id}, ${stripeApp.id}, 'payment_processing', true,
          'Dashboard handles subscription and payment management'
        )
        RETURNING *
      `;
      sampleDependencies.push(dep2);
    }

    if (dashboardApp && memoryApp) {
      const [dep3] = await sql`
        INSERT INTO app_dependencies (
          app_id, depends_on_app_id, dependency_type, is_critical, notes
        ) VALUES (
          ${dashboardApp.id}, ${memoryApp.id}, 'data_source', false,
          'Dashboard can access memory system for insights'
        )
        RETURNING *
      `;
      sampleDependencies.push(dep3);
    }

    return Response.json({
      success: true,
      message: "Demo app data populated successfully",
      results: {
        apps: createdApps.map((app) => ({
          id: app.id,
          name: app.name,
          type: app.app_type,
          domain: app.domain,
          provider: app.provider_name,
        })),
        secrets: createdSecrets.map((secret) => ({
          id: secret.id,
          key: secret.secret_key,
          app_id: secret.app_id,
          required: secret.is_required,
        })),
        dependencies: sampleDependencies.length,
      },
      summary: {
        total_apps: createdApps.length,
        internal_apps: createdApps.filter((a) => a.app_type === "internal")
          .length,
        external_apis: createdApps.filter((a) => a.app_type === "external_api")
          .length,
        saas_tools: createdApps.filter((a) => a.app_type === "saas_tool")
          .length,
        total_secrets: createdSecrets.length,
        total_dependencies: sampleDependencies.length,
      },
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Error populating demo app data:", error);
    return Response.json(
      {
        error: "Failed to populate demo app data",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
