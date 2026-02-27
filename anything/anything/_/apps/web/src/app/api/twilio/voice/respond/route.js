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

async function parseForm(request) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) {
    obj[k] = v;
  }
  return obj;
}

export async function POST(request) {
  try {
    const form = await parseForm(request);

    const transcript = (form.SpeechResult || "").trim();
    const caller = (form.From || "").trim();

    const fallback =
      "No problem. If you can, please say your name, your address, and what’s going on with the system.";

    if (!transcript) {
      const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/voice/respond" method="POST">
    <Say>${xmlEscape(fallback)}</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice</Redirect>
</Response>`;
      return twiml(body);
    }

    // Ask ChatGPT to respond like a friendly phone intake assistant.
    const systemPrompt =
      "You are a calm, friendly phone assistant for Goldey’s Heating and Cooling in Shelbyville, KY. Your goal is to quickly help the caller and capture: name, service address, call-back phone number, what’s wrong, and how urgent it is. Keep responses short for voice (1-2 sentences). Ask at most ONE follow-up question. If it sounds like an emergency (no heat in freezing weather, no AC in extreme heat, elderly/medical), tell them to stay safe and that a tech will call back ASAP. Never mention AI.";

    const userPromptLines = [
      `Caller phone: ${caller || "unknown"}`,
      "Caller said:",
      transcript,
      "",
      "Respond as the assistant. End by asking one follow-up question OR confirming you'll have someone call them back.",
    ];

    const response = await fetch(
      `${process.env.APP_URL}/integrations/chat-gpt/conversationgpt4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPromptLines.join("\n") },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `When fetching ChatGPT, the response was [${response.status}] ${response.statusText}`,
      );
    }

    const data = await response.json();
    const assistantText =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Thanks. We’ll have someone reach back shortly. If this is urgent, please call 502-262-0913.";

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${xmlEscape(assistantText)}</Say>
  <Pause length="1" />
  <Redirect method="POST">/api/twilio/voice</Redirect>
</Response>`;

    return twiml(body);
  } catch (error) {
    console.error(error);

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry — we’re having trouble right now. Please call 502-262-0913 and we’ll help you.</Say>
  <Hangup />
</Response>`;

    return twiml(body);
  }
}
