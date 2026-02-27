export async function GET(request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "";

    return Response.json({ host, proto, cookieHeader });
  } catch (error) {
    console.error("GET /api/debug/cookies error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
