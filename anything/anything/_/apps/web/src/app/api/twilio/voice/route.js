function xmlEscape(unsafe) {
  if (unsafe == null) {
    return "";
  }
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function twiml(body) {
  return new Response(body, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request) {
  // Twilio hits this URL when the call starts.
  // We keep it simple: greet + speech gather.

  const greeting =
    "Hi! You’ve reached Goldey’s Heating and Cooling. I’m the assistant. How can we help today? You can say your name, your address, and what’s going on.";

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/voice/respond" method="POST">
    <Say>${xmlEscape(greeting)}</Say>
  </Gather>
  <Say>Sorry, I didn’t catch that. Please call again, or try once more after the beep.</Say>
  <Redirect method="POST">/api/twilio/voice</Redirect>
</Response>`;

  return twiml(body);
}

export async function GET() {
  // Useful for quick browser testing.
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This endpoint is for Twilio voice webhooks. Please configure it in Twilio.</Say>
</Response>`;
  return twiml(body);
}
