import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, keys } = body;

    if (action === "configure") {
      // Store memory keys securely
      if (!keys || !keys.enterprise || !keys.business || !keys.app) {
        return Response.json(
          { error: "All three memory keys are required" },
          { status: 400 },
        );
      }

      // Basic format validation - ensure keys have the expected structure
      if (!keys.enterprise.startsWith("ent_") || keys.enterprise.length < 10) {
        return Response.json(
          {
            error:
              "Enterprise key must start with 'ent_' and be at least 10 characters",
          },
          { status: 400 },
        );
      }

      if (!keys.business.startsWith("bus_") || keys.business.length < 10) {
        return Response.json(
          {
            error:
              "Business key must start with 'bus_' and be at least 10 characters",
          },
          { status: 400 },
        );
      }

      if (keys.app.length < 10) {
        return Response.json(
          { error: "App key must be at least 10 characters" },
          { status: 400 },
        );
      }

      // Store keys as environment variables (in production these would be stored securely)
      process.env.ENTERPRISE_MEMORY_KEY = keys.enterprise;
      process.env.BUSINESS_MEMORY_KEY = keys.business;
      process.env.APP_MEMORY_KEY = keys.app;

      console.log("Memory keys configured successfully");

      return Response.json({
        success: true,
        message: "Memory keys configured successfully",
        keys_configured: {
          enterprise: !!process.env.ENTERPRISE_MEMORY_KEY,
          business: !!process.env.BUSINESS_MEMORY_KEY,
          app: !!process.env.APP_MEMORY_KEY,
        },
      });
    }

    if (action === "validate") {
      // Check if keys are configured
      const validation = {
        enterprise_key: !!process.env.ENTERPRISE_MEMORY_KEY,
        business_key: !!process.env.BUSINESS_MEMORY_KEY,
        app_key: !!process.env.APP_MEMORY_KEY,
        all_keys_valid: !!(
          process.env.ENTERPRISE_MEMORY_KEY &&
          process.env.BUSINESS_MEMORY_KEY &&
          process.env.APP_MEMORY_KEY
        ),
      };

      return Response.json({
        success: true,
        validation,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing memory keys:", error);
    return Response.json(
      { error: "Failed to manage memory keys" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Return configuration status (never return actual keys)
    const status = {
      keys_configured: {
        enterprise: !!process.env.ENTERPRISE_MEMORY_KEY,
        business: !!process.env.BUSINESS_MEMORY_KEY,
        app: !!process.env.APP_MEMORY_KEY,
      },
      total_configured: [
        process.env.ENTERPRISE_MEMORY_KEY,
        process.env.BUSINESS_MEMORY_KEY,
        process.env.APP_MEMORY_KEY,
      ].filter(Boolean).length,
      last_updated: new Date().toISOString(),
    };

    return Response.json({ status });
  } catch (error) {
    console.error("Error checking memory keys status:", error);
    return Response.json({ error: "Failed to check status" }, { status: 500 });
  }
}
