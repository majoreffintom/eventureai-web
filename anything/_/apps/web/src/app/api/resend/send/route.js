import sql from "@/app/api/utils/sql";

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

export async function POST(request) {
  const startedAt = Date.now();

  try {
    const body = await request.json().catch(() => ({}));

    const to = body?.to;
    const toList = Array.isArray(to)
      ? to.filter((x) => typeof x === "string" && x.trim())
      : typeof to === "string" && to.trim()
        ? [to.trim()]
        : [];

    const subject = safeStr(body?.subject || "").trim();
    const html = safeStr(body?.html || "").trim();
    const text = safeStr(body?.text || "").trim();

    // Default from. If you want to use tom@eventureai.com, you must verify the eventureai.com domain in Resend.
    const from = safeStr(body?.from || "").trim() || "onboarding@resend.dev";

    if (toList.length === 0) {
      return Response.json(
        { ok: false, error: "Missing 'to' (email address)" },
        { status: 400 },
      );
    }

    if (!subject) {
      return Response.json(
        { ok: false, error: "Missing 'subject'" },
        { status: 400 },
      );
    }

    if (!html && !text) {
      return Response.json(
        { ok: false, error: "Provide either 'html' or 'text'" },
        { status: 400 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return Response.json(
        {
          ok: false,
          error:
            "RESEND_API_KEY is not set. Add it in Project Settings → Secrets, then retry.",
          setup:
            "After adding the key, also verify your domain in Resend if you want to send from tom@eventureai.com.",
        },
        { status: 500 },
      );
    }

    // Create a log row first so we can track failures too.
    const [logRow] = await sql`
      INSERT INTO mail_server_logs (
        message_id,
        operation_type,
        from_address,
        to_address,
        subject,
        body_preview,
        attachments,
        status,
        priority,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${`resend_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`},
        ${"resend_send"},
        ${from},
        ${toList},
        ${subject},
        ${text ? text.slice(0, 240) : html.slice(0, 240)},
        ${0},
        ${"processing"},
        ${"normal"},
        ${JSON.stringify({ provider: "resend" })},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id, message_id
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
      }),
    });

    const raw = await resendResponse.text();
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }

    if (!resendResponse.ok) {
      const providerError =
        parsed?.message || parsed?.error || raw || "Unknown error";

      await sql`
        UPDATE mail_server_logs
        SET
          status = ${"failed"},
          updated_at = CURRENT_TIMESTAMP,
          metadata = ${JSON.stringify({
            provider: "resend",
            resend_status: resendResponse.status,
            resend_error: providerError,
            duration_ms: Date.now() - startedAt,
          })}
        WHERE id = ${logRow.id}
      `;

      return Response.json(
        {
          ok: false,
          error: `Resend request failed: ${providerError}`,
          hint: from.includes("@eventureai.com")
            ? "If you're trying to send from tom@eventureai.com, make sure you have verified the eventureai.com domain inside Resend. Otherwise try onboarding@resend.dev as the From address."
            : "Double-check your 'to' email and your Resend API key.",
        },
        { status: 502 },
      );
    }

    const resendId = parsed?.id || parsed?.data?.id || null;

    await sql`
      UPDATE mail_server_logs
      SET
        status = ${"sent"},
        updated_at = CURRENT_TIMESTAMP,
        metadata = ${JSON.stringify({
          provider: "resend",
          resend_id: resendId,
          duration_ms: Date.now() - startedAt,
        })}
      WHERE id = ${logRow.id}
    `;

    return Response.json({ ok: true, id: resendId, log_id: logRow.id });
  } catch (e) {
    console.error("/api/resend/send POST error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to send email" },
      { status: 500 },
    );
  }
}
