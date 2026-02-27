"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";

function isProbablyEmail(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return v.includes("@");
}

export default function ResendTestPage() {
  const queryClient = useQueryClient();

  const [from, setFrom] = useState("tom@eventureai.com");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Test email from EventureAI");
  const [text, setText] = useState(
    "This is a test email sent from EventureAI using Resend.",
  );
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const canSend = useMemo(() => {
    if (!isProbablyEmail(to)) return false;
    if (!subject.trim()) return false;
    if (!text.trim()) return false;
    return true;
  }, [to, subject, text]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setSuccess(null);

      const payload = {
        from: from.trim() || "onboarding@resend.dev",
        to: to.trim(),
        subject: subject.trim(),
        text: text.trim(),
      };

      const response = await fetch("/api/resend/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg =
          body?.error ||
          `When calling /api/resend/send, the response was [${response.status}] ${response.statusText}`;
        throw new Error(msg);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSuccess({
        id: data?.id || null,
        logId: data?.log_id,
      });

      // If you later add a "Mail Logs" view, this makes it refresh.
      queryClient.invalidateQueries({ queryKey: ["mail-server-logs"] });
    },
    onError: (e) => {
      console.error(e);
      setError(
        e?.message ||
          "Could not send the test email. Please check your Resend API key and sender domain.",
      );
    },
  });

  const onSend = useCallback(() => {
    if (!canSend) return;
    sendMutation.mutate();
  }, [canSend, sendMutation]);

  const fromHint = useMemo(() => {
    const f = from.trim().toLowerCase();
    if (!f) return "";

    if (f.endsWith("@eventureai.com")) {
      return "To send from @eventureai.com, you must verify the eventureai.com domain inside Resend. If you haven't yet, try onboarding@resend.dev as a temporary From.";
    }

    if (f === "onboarding@resend.dev") {
      return "onboarding@resend.dev is useful for quick testing. For your real sender (tom@eventureai.com), verify your domain in Resend first.";
    }

    return "";
  }, [from]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-black/10 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Resend email test</h1>
              <p className="text-sm text-black/60">
                Send a test email and confirm your sender domain is working.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">From</span>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="tom@eventureai.com"
                className="h-11 px-3 rounded-lg border border-black/15 focus:outline-none focus:ring-2 focus:ring-black/30"
              />
              {fromHint ? (
                <span className="text-xs text-black/60">{fromHint}</span>
              ) : null}
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">To</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="you@example.com"
                className="h-11 px-3 rounded-lg border border-black/15 focus:outline-none focus:ring-2 focus:ring-black/30"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 px-3 rounded-lg border border-black/15 focus:outline-none focus:ring-2 focus:ring-black/30"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Message</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="p-3 rounded-lg border border-black/15 focus:outline-none focus:ring-2 focus:ring-black/30"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Sent!{success.id ? ` Resend id: ${success.id}` : ""} (log:{" "}
                {success.logId})
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend || sendMutation.isPending}
                className={
                  canSend && !sendMutation.isPending
                    ? "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-black text-white hover:bg-black/90"
                    : "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-black/20 text-black/60 cursor-not-allowed"
                }
              >
                <Send size={16} />
                {sendMutation.isPending ? "Sending..." : "Send test email"}
              </button>

              <a
                href="/memory"
                className="text-sm text-black/70 hover:text-black underline"
              >
                Back to Memory
              </a>
            </div>
          </div>

          <div className="mt-6 text-xs text-black/60">
            Note: If sending fails, add your Resend API key as RESEND_API_KEY in
            Project Settings → Secrets.
          </div>
        </div>
      </div>
    </div>
  );
}
