import { sendEmail } from "@/app/api/utils/send-email";

function escapeHtml(unsafe) {
  if (unsafe == null) {
    return "";
  }
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const name = (body?.name || "").trim();
    const phone = (body?.phone || "").trim();
    const email = (body?.email || "").trim();
    const message = (body?.message || "").trim();

    // Phone is optional (user asked). Name/email/message are required.
    if (!name || !email || !message) {
      return Response.json(
        { error: "Please fill in name, email, and a description." },
        { status: 400 },
      );
    }

    const to = "goldeyshvac@yahoo.com";
    const subject = `New website service request — ${name}`;

    const phoneLine = phone ? phone : "(not provided)";

    const text = [
      "New website service request",
      "",
      `Name: ${name}`,
      `Phone: ${phoneLine}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
      "",
      `Submitted: ${new Date().toISOString()}`,
    ].join("\n");

    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4;">
        <h2 style="margin: 0 0 12px 0;">New website service request</h2>
        <div style="margin: 0 0 12px 0;">
          <div><b>Name:</b> ${escapeHtml(name)}</div>
          <div><b>Phone:</b> ${escapeHtml(phoneLine)}</div>
          <div><b>Email:</b> ${escapeHtml(email)}</div>
          <div><b>Submitted:</b> ${escapeHtml(new Date().toISOString())}</div>
        </div>
        <div style="margin-top: 12px;">
          <div><b>Message:</b></div>
          <div style="white-space: pre-wrap;">${escapeHtml(message)}</div>
        </div>
      </div>
    `;

    await sendEmail({
      to,
      subject,
      html,
      text,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        error:
          "Sorry — we couldn’t send your request right now. Please call 502-262-0913.",
      },
      { status: 500 },
    );
  }
}
