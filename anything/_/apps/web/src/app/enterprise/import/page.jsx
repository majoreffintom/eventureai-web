"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, ListTodo, UploadCloud } from "lucide-react";
import useUser from "@/utils/useUser";

function Card({ children }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6">
      {children}
    </div>
  );
}

export default function EnterpriseImportPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Default bucket is now EventureAI
  const [appKey, setAppKey] = useState("eventureai");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // NEW: batch/split import toggle
  const [splitConversations, setSplitConversations] = useState(true);

  const bootstrapQuery = useQuery({
    queryKey: ["enterprise-bootstrap"],
    enabled: Boolean(user),
    queryFn: async () => {
      const res = await fetch("/api/enterprise/bootstrap", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting /api/enterprise/bootstrap, the response was [${res.status}] ${text}`,
        );
      }
      return res.json();
    },
  });

  const apps = bootstrapQuery.data?.apps || [];

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/enterprise/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: appKey,
          title,
          content,
          split: splitConversations,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting /api/enterprise/conversations, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-tasks"] });

      // Supports both single and split imports
      const imported = data?.imported ?? 1;
      const results = Array.isArray(data?.results) ? data.results : [];
      const turnsTouched = results.reduce(
        (sum, r) => sum + (Number(r?.turns_touched) || 0),
        0,
      );
      const legacyInserted = results.reduce(
        (sum, r) => sum + (Number(r?.legacy_memory_entries_inserted) || 0),
        0,
      );
      const tasksInserted = results.reduce(
        (sum, r) => sum + (Number(r?.tasks_inserted) || 0),
        0,
      );

      setSuccess(
        `Saved ${imported} conversation(s). Turns: ${turnsTouched}. Mirrored to /memory: ${legacyInserted}. Tasks extracted: ${tasksInserted}.`,
      );
      setTitle("");
      setContent("");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not import conversation");
    },
  });

  const callbackUrl = useMemo(() => {
    return encodeURIComponent("/enterprise/import");
  }, []);

  const busy =
    userLoading ||
    bootstrapQuery.isLoading ||
    bootstrapQuery.isFetching ||
    importMutation.isPending;

  const onFillWithLatest = useCallback(() => {
    // Convenience: paste what the user posted in chat (Conversation 3 included).
    const sample = `Please make note of using resend instead of Mailgun. Also need to add the app nifty which is my nft marketplace running at bethefirstnft.com which uses alchemy and MetaMask to write to polygon\n\nConversation 3\nAbsolutely — “agent vs LLM” is a great call for Battle Royale.\n\nHere’s what I set up right now so we can plug your memory system in cleanly...\n\n## What’s now live in your app\n### 1) Battle Royale (Agent vs LLM) + public voting\n- Admin creates a match: /admin/battle\n- Public can view & vote: /battle and /battle/[id]\n\n## What I need from you next\n1) Does it return plain text context for a query, or structured memory blocks?\n\n## About Mailgun + Twilio\n- Mailgun / Twilio via custom API routes + secrets\n`;

    setContent(sample);
    if (!title.trim()) {
      setTitle("Imported conversations (chat)");
    }
  }, [title]);

  if (userLoading) {
    return (
      <div
        className="min-h-screen text-black flex items-center justify-center p-6"
        style={{ backgroundColor: "#F2F2F7" }}
      >
        <div className="max-w-md w-full rounded-2xl border border-black/10 bg-white p-6">
          <div className="text-lg tracking-wide">Loading…</div>
          <div className="mt-2 text-sm text-black/60">Checking sign-in.</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen text-black p-6"
        style={{ backgroundColor: "#F2F2F7" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-black/10 flex items-center justify-center">
                <Inbox size={18} />
              </div>
              <div>
                <div className="text-xl tracking-wide">Enterprise Import</div>
                <div className="text-sm text-black/60">
                  Sign in to save conversations into SQL.
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 flex-col sm:flex-row">
              <a
                className="px-4 py-2 rounded-md bg-black text-white text-center"
                href={`/account/signin?callbackUrl=${callbackUrl}`}
              >
                Sign in
              </a>
              <a
                className="px-4 py-2 rounded-md border border-black/20 text-center"
                href={`/account/signup?callbackUrl=${callbackUrl}`}
              >
                Create account
              </a>
              <a
                className="px-4 py-2 rounded-md border border-black/20 text-center"
                href="/"
              >
                Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasApps = Array.isArray(apps) && apps.length > 0;

  return (
    <div
      className="min-h-screen text-black"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <div
        className="border-b"
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          WebkitBackdropFilter: "blur(18px)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-black/10 flex items-center justify-center">
            <Inbox size={18} />
          </div>
          <div className="flex-1">
            <div className="text-xl tracking-wide">Enterprise Import</div>
            <div className="text-sm text-black/60">
              Paste conversations from chat, tag them to apps, and store them in
              Postgres.
            </div>
          </div>
          <a
            href="/enterprise/tasks"
            className="px-4 py-2 rounded-full active:scale-95 transition-transform text-sm flex items-center gap-2"
            style={{
              backgroundColor: "rgba(255,255,255,0.70)",
              border: "1px solid rgba(0,0,0,0.10)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 20px rgba(0,0,0,0.06)",
            }}
          >
            <ListTodo size={16} />
            Tasks
          </a>
          <a
            className="ml-2 px-4 py-2 rounded-full active:scale-95 transition-transform"
            style={{
              backgroundColor: "rgba(255,255,255,0.70)",
              border: "1px solid rgba(0,0,0,0.10)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 20px rgba(0,0,0,0.06)",
            }}
            href="/account/logout"
          >
            Sign out
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        ) : null}

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-lg tracking-wide">Import conversations</div>
              <div className="text-sm text-black/60 mt-1">
                Tip: leave “Split conversations” on so you can paste multiple
                chats at once.
              </div>
            </div>
            <button
              type="button"
              onClick={onFillWithLatest}
              disabled={busy}
              className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide flex items-center gap-2 ${
                busy ? "bg-black/5 text-black/40" : "bg-white hover:bg-black/5"
              }`}
            >
              <UploadCloud size={16} />
              Fill with an example
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-black/70 mb-1">Default app</div>
              <select
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
              >
                {!hasApps ? (
                  <option value="eventureai">eventureai</option>
                ) : null}
                {apps.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key}
                  </option>
                ))}
              </select>
              <div className="text-xs text-black/50 mt-2">
                Stored under Memoria index: Enterprise_Dashboard &gt;
                (auto-detect per conversation, else uses {appKey})
              </div>
            </div>

            <div>
              <div className="text-sm text-black/70 mb-1">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none"
                placeholder="Short title for this import batch"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={splitConversations}
                  onChange={(e) => setSplitConversations(e.target.checked)}
                />
                Split conversations (looks for “Conversation 3” / “Next
                conversation” markers)
              </label>
              <div className="text-xs text-black/50 mt-1">
                This is the easiest way to paste all 14 conversations at once.
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-black/70 mb-1">Conversation(s)</div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/15 outline-none"
                rows={14}
                placeholder="Paste one or more conversations here…"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => importMutation.mutate()}
              disabled={busy || !content.trim()}
              className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide ${
                busy || !content.trim()
                  ? "bg-black/5 text-black/40"
                  : "bg-black text-white hover:bg-black/90"
              }`}
            >
              {importMutation.isPending ? "Saving…" : "Save"}
            </button>

            <a href="/memory" className="text-sm underline text-black/70">
              Open /memory
            </a>
          </div>
        </Card>

        <div className="text-sm text-black/60">
          Keep pasting more conversations — the importer will save them into SQL
          (memoria_threads + memoria_turns) and also mirror them into /memory so
          you can see them right away.
        </div>
      </div>
    </div>
  );
}
