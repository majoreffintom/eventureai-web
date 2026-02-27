import { requireMemoriaAdmin } from "@/app/api/utils/memoriaAdmin";

// EventureAI configuration check endpoint
// Returns which required secrets are present (without exposing values)

const REQUIRED_KEYS = [
  "EVENTUREAI_API_KEY",
  "APP_MEMORY_KEY",
  "BUSINESS_MEMORY_KEY",
  "ENTERPRISE_MEMORY_KEY",
  "CRON_SECRET",
];

export async function GET(request) {
  try {
    await requireMemoriaAdmin(request);

    const present = {};
    const missing = [];

    for (const key of REQUIRED_KEYS) {
      const exists = Boolean(
        process.env[key] && String(process.env[key]).trim().length > 0,
      );
      present[key] = exists;
      if (!exists) missing.push(key);
    }

    const configured = missing.length === 0;

    return Response.json({
      configured,
      present,
      missing,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 401 || status === 403) {
      return Response.json({ error: error.message }, { status });
    }

    console.error("Config check failed:", error);
    return Response.json(
      { error: "Config check failed", details: error.message },
      { status: 500 },
    );
  }
}
