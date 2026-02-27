import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  const rawUserId = session?.user?.id;
  const userId = Number(rawUserId);

  if (!Number.isFinite(userId)) {
    return { session: null, userId: null };
  }

  return { session, userId };
}

export function isSafeIntegrationEndpoint(endpoint) {
  if (typeof endpoint !== "string") return false;
  // Only allow Anything integration endpoints.
  return endpoint.startsWith("/integrations/");
}

export async function callIntegrationLLM({ endpoint, messages, jsonSchema }) {
  const safeEndpoint = endpoint || "/integrations/chat-gpt/conversationgpt4";

  if (!isSafeIntegrationEndpoint(safeEndpoint)) {
    throw new Error(
      "Invalid LLM endpoint. Only /integrations/* endpoints are allowed.",
    );
  }

  const payload = {
    messages,
  };

  if (jsonSchema) {
    payload.json_schema = jsonSchema;
  }

  const res = await fetch(safeEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `When calling ${safeEndpoint}, the response was [${res.status}] ${text}`,
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("LLM response did not include choices[0].message.content");
  }

  // Most integrations return a JSON string when json_schema is provided.
  try {
    return JSON.parse(content);
  } catch {
    return { response: content };
  }
}
