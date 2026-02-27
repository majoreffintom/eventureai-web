"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, MessageSquare, RefreshCw, UploadCloud } from "lucide-react";
import useUser from "@/utils/useUser";

function Card({ children }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6">
      {children}
    </div>
  );
}

export default function MemoriaConversationsPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const conversationsQuery = useQuery({
    queryKey: ["memoria-seed-conversations"],
    enabled: Boolean(user),
    queryFn: async () => {
      const res = await fetch(
        "/api/memoria/debug/conversations?limit_threads=14&limit_turns=10",
      );
      if (!res.ok) {
        throw new Error(
          `When fetching /api/memoria/debug/conversations, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/memoria/debug/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting /api/memoria/debug/seed, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["memoria-seed-conversations"],
      });
      const threadsTouched = data?.threads_touched;
      const turnsTouched = data?.turns_touched;
      const inserted = data?.legacy_memory_entries_inserted;
      const msg = `Seeded / updated ${threadsTouched} threads and ${turnsTouched} turns. Legacy entries inserted: ${inserted}.`;
      setSuccess(msg);
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not seed conversations");
    },
  });

  const threads = conversationsQuery.data?.threads || [];
  const legacyCount = conversationsQuery.data?.legacy_memory_entries_count;

  const busy =
    userLoading ||
    conversationsQuery.isLoading ||
    seedMutation.isPending ||
    conversationsQuery.isFetching;

  const callbackUrl = useMemo(() => {
    return encodeURIComponent("/memoria/conversations");
  }, []);

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
                <Database size={18} />
              </div>
              <div>
                <div className="text-xl tracking-wide">
                  Memoria Conversations
                </div>
                <div className="text-sm text-black/60">
                  Sign in to seed 14 conversations and verify DB read/write.
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

  const seedButtonLabel = seedMutation.isPending
    ? "Seeding…"
    : "Seed 14 conversations";

  const refreshLabel = conversationsQuery.isFetching
    ? "Refreshing…"
    : "Refresh";

  const legacyCountLabel = Number.isFinite(Number(legacyCount))
    ? String(legacyCount)
    : "—";

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
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <MessageSquare size={18} />
          </div>
          <div className="flex-1">
            <div className="text-xl tracking-wide">Memoria Conversations</div>
            <div className="text-sm text-black/60">
              Seed 14 sample threads + turns into{" "}
              <span className="font-mono">memoria_threads</span> and{" "}
              <span className="font-mono">memoria_turns</span>, and also write
              legacy entries into{" "}
              <span className="font-mono">memory_entries</span>.
            </div>
          </div>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg tracking-wide">Write test</div>
              <div className="text-sm text-black/60 mt-1">
                Click seed to write 14 conversations. You can safely run it
                multiple times.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => seedMutation.mutate()}
                disabled={busy}
                className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide flex items-center gap-2 ${
                  busy
                    ? "bg-black/5 text-black/40"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                <UploadCloud size={16} />
                {seedButtonLabel}
              </button>

              <button
                type="button"
                onClick={() => conversationsQuery.refetch()}
                disabled={busy}
                className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide flex items-center gap-2 ${
                  busy
                    ? "bg-black/5 text-black/40"
                    : "bg-white hover:bg-black/5"
                }`}
              >
                <RefreshCw size={16} />
                {refreshLabel}
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-black/70">
            Legacy memory entries written (for your existing{" "}
            <a className="underline" href="/memory">
              /memory
            </a>{" "}
            page): <span className="font-mono">{legacyCountLabel}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-sm tracking-wide">What’s being written?</div>
            <div className="mt-2 text-sm text-black/60">
              Server writes into:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>
                  <span className="font-mono">memoria_threads</span> (one per
                  conversation)
                </li>
                <li>
                  <span className="font-mono">memoria_turns</span> (two turns
                  per conversation)
                </li>
                <li>
                  <span className="font-mono">memory_entries</span> (legacy
                  mirror for your current Memory UI)
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg tracking-wide">Read test</div>
              <div className="text-sm text-black/60 mt-1">
                This is a live read from Postgres via{" "}
                <span className="font-mono">
                  GET /api/memoria/debug/conversations
                </span>
                .
              </div>
            </div>
            <a
              href="/memory"
              className="text-sm underline text-black/70 whitespace-nowrap"
            >
              Open /memory
            </a>
          </div>

          <div className="mt-5 space-y-3">
            {conversationsQuery.isError ? (
              <div className="text-sm text-red-700">
                Could not load conversations. Check server logs.
              </div>
            ) : null}

            {!conversationsQuery.isLoading && threads.length === 0 ? (
              <div className="text-sm text-black/60">
                No seeded conversations found yet. Click “Seed 14
                conversations”.
              </div>
            ) : null}

            {threads.map((t) => {
              const turns = Array.isArray(t.turns) ? t.turns : [];
              const topic = t.metadata?.topic || "";
              const topicLabel = topic ? `Topic: ${topic}` : "";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-black/10 bg-white p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base tracking-wide truncate">
                        {t.title || "(untitled)"}
                      </div>
                      <div className="text-xs text-black/60 mt-1 truncate font-mono">
                        {t.external_id}
                      </div>
                      {topicLabel ? (
                        <div className="text-xs text-black/60 mt-1">
                          {topicLabel}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-xs text-black/50 whitespace-nowrap">
                      {turns.length} turns
                    </div>
                  </div>

                  {turns.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {turns.map((tr) => {
                        const userText = tr.user_text || "";
                        const assistantResponse = tr.assistant_response || "";
                        const turnTitle = `Turn ${tr.turn_index}`;

                        return (
                          <div
                            key={tr.external_turn_id}
                            className="rounded-xl border border-black/10 p-3"
                          >
                            <div className="text-xs text-black/60 font-mono">
                              {turnTitle}
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-black/60">
                                  User
                                </div>
                                <div className="mt-1 text-sm whitespace-pre-wrap">
                                  {userText}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-black/60">
                                  Assistant
                                </div>
                                <div className="mt-1 text-sm whitespace-pre-wrap">
                                  {assistantResponse}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="text-sm text-black/60">
          Want me to seed your real 14 conversations instead of these
          placeholders? If you paste them here (or upload), I can store them
          exactly as threads + turns.
        </div>
      </div>
    </div>
  );
}
