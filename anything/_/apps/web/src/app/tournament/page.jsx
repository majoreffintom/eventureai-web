"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, FileUp, Swords, Trophy, User } from "lucide-react";
import MarketingHeader from "@/components/Marketing/MarketingHeader";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(0,0,0,0.06)",
          WebkitBackdropFilter: "blur(16px)",
          backdropFilter: "blur(16px)",
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-lg tracking-wide">{title}</div>
        {subtitle ? (
          <div className="text-sm text-black/60">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function TournamentPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Agent create
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentSystemPrompt, setAgentSystemPrompt] = useState("");
  const [agentIsPublic, setAgentIsPublic] = useState(false);

  // NEW: pick which LLM integration the agent uses
  const llmEndpointOptions = useMemo(() => {
    return [
      {
        label: "ChatGPT (GPT-4)",
        value: "/integrations/chat-gpt/conversationgpt4",
      },
      { label: "Grok 4 (0709)", value: "/integrations/grok-4-0709/" },
      {
        label: "Cohere Command R+",
        value: "/integrations/cohere-command-r-plus/",
      },
    ];
  }, []);

  const [agentLlmEndpoint, setAgentLlmEndpoint] = useState(
    "/integrations/chat-gpt/conversationgpt4",
  );

  // Training
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [trainingFile, setTrainingFile] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();

  // Match
  const [agentAId, setAgentAId] = useState("");
  const [agentBId, setAgentBId] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");

  const clearAlerts = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const agentsQuery = useQuery({
    queryKey: ["tournament-agents"],
    queryFn: async () => {
      const res = await fetch("/api/tournament/agents");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/tournament/agents, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const agents = agentsQuery.data?.agents || [];

  const myAgents = useMemo(() => {
    if (!user) return [];
    const userIdNum = Number(user.id);
    if (!Number.isFinite(userIdNum)) return [];
    return agents.filter((a) => Number(a.owner_user_id) === userIdNum);
  }, [agents, user]);

  const createAgentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tournament/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          system_prompt: agentSystemPrompt,
          llm_endpoint: agentLlmEndpoint,
          is_public: agentIsPublic,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting /api/tournament/agents, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      clearAlerts();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournament-agents"] });
      setAgentName("");
      setAgentDescription("");
      setAgentSystemPrompt("");
      setAgentIsPublic(false);
      setAgentLlmEndpoint("/integrations/chat-gpt/conversationgpt4");
      setSuccess(`Agent created: ${data?.agent?.name || "(unknown)"}`);
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not create agent");
    },
  });

  const addTrainingDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) {
        throw new Error("Pick an agent to train");
      }
      if (!trainingFile) {
        throw new Error("Pick a file to upload");
      }

      const uploadResult = await upload({ file: trainingFile });
      if (uploadResult?.error) {
        throw new Error(uploadResult.error);
      }

      const res = await fetch(
        `/api/tournament/agents/${selectedAgentId}/training-docs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trainingTitle,
            notes: trainingNotes,
            file_url: uploadResult.url,
            file_mime_type: uploadResult.mimeType,
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting training docs, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      clearAlerts();
    },
    onSuccess: () => {
      setTrainingTitle("");
      setTrainingNotes("");
      setTrainingFile(null);
      setSuccess("Training doc uploaded and attached to agent");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not upload training doc");
    },
  });

  const runMatchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tournament/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_a_id: agentAId,
          agent_b_id: agentBId,
          prompt: questionPrompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting /api/tournament/matches, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      clearAlerts();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
      setSuccess("Match completed and saved to memory");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not run match");
    },
  });

  const matchesQuery = useQuery({
    queryKey: ["tournament-matches"],
    enabled: Boolean(user),
    queryFn: async () => {
      const res = await fetch("/api/tournament/matches");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/tournament/matches, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const matches = matchesQuery.data?.matches || [];
  const latestMatch = runMatchMutation.data?.match || null;

  const isBusy =
    createAgentMutation.isPending ||
    addTrainingDocMutation.isPending ||
    runMatchMutation.isPending ||
    uploadLoading;

  if (userLoading) {
    return (
      <div
        className="min-h-screen text-black"
        style={{ backgroundColor: "#F2F2F7" }}
      >
        <MarketingHeader />
        <div className="flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-black/10 bg-white p-6">
            <div className="text-lg tracking-wide">Loading…</div>
            <div className="mt-2 text-sm text-black/60">Checking sign-in.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen text-black"
        style={{ backgroundColor: "#F2F2F7" }}
      >
        <MarketingHeader />
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border border-black/10 flex items-center justify-center">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-xl tracking-wide">Memory Tournament</div>
                  <div className="text-sm text-black/60">
                    Sign in to create agents, upload training docs, and run
                    matches.
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3 flex-col sm:flex-row">
                <a
                  className="px-4 py-2 rounded-md bg-black text-white text-center"
                  href="/account/signin?callbackUrl=/tournament"
                >
                  Sign in
                </a>
                <a
                  className="px-4 py-2 rounded-md border border-black/20 text-center"
                  href="/account/signup?callbackUrl=/tournament"
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
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-black"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <MarketingHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        ) : null}
        {success ? (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Create + Agents */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <SectionTitle
                icon={Bot}
                title="Create your agent"
                subtitle="Give it a name, choose a model, and add a simple instruction prompt."
              />

              <div className="mt-5 space-y-3">
                <div>
                  <div className="text-sm text-black/70 mb-1">Name</div>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none"
                    placeholder="e.g. Finance Analyst"
                  />
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">
                    Short description
                  </div>
                  <input
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none"
                    placeholder="What is this agent good at?"
                  />
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">Model</div>
                  <select
                    value={agentLlmEndpoint}
                    onChange={(e) => setAgentLlmEndpoint(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
                  >
                    {llmEndpointOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-black/50 mt-2">
                    Grok + Cohere are now available for tournament agents.
                  </div>
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">
                    System prompt (optional)
                  </div>
                  <textarea
                    value={agentSystemPrompt}
                    onChange={(e) => setAgentSystemPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 outline-none"
                    rows={4}
                    placeholder="Rules, tone, format, constraints…"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={agentIsPublic}
                    onChange={(e) => setAgentIsPublic(e.target.checked)}
                  />
                  Make this agent public (others can use it in matches)
                </label>

                <button
                  type="button"
                  onClick={() => createAgentMutation.mutate()}
                  disabled={isBusy || !agentName.trim()}
                  className={`w-full h-[44px] rounded-xl border border-black/15 px-4 tracking-wide ${
                    !agentName.trim() || isBusy
                      ? "bg-black/5 text-black/40"
                      : "bg-black text-white hover:bg-black/90"
                  }`}
                >
                  {createAgentMutation.isPending ? "Creating…" : "Create agent"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <SectionTitle
                icon={Bot}
                title="Your agents"
                subtitle="These are the agents you own."
              />

              <div className="mt-5 space-y-2">
                {agentsQuery.isLoading ? (
                  <div className="text-sm text-black/60">Loading agents…</div>
                ) : null}

                {myAgents.length === 0 && !agentsQuery.isLoading ? (
                  <div className="text-sm text-black/60">
                    No agents yet. Create one above.
                  </div>
                ) : null}

                {myAgents.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base tracking-wide">{a.name}</div>
                        <div className="text-sm text-black/60">
                          {a.description || "(no description)"}
                        </div>
                      </div>
                      <div className="text-xs rounded-full border border-black/15 px-2 py-1">
                        {a.is_public ? "Public" : "Private"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Train + Match + History */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <SectionTitle
                icon={FileUp}
                title="Teach (upload training docs)"
                subtitle="Uploads are saved as links and referenced in prompts."
              />

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-black/70 mb-1">Agent</div>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
                  >
                    <option value="">Pick one…</option>
                    {myAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">File</div>
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setTrainingFile(f);
                    }}
                    className="w-full h-[42px] px-3 py-2 rounded-xl border border-black/15 bg-white"
                  />
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">
                    Title (optional)
                  </div>
                  <input
                    value={trainingTitle}
                    onChange={(e) => setTrainingTitle(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none"
                    placeholder="e.g. My finance notes"
                  />
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">
                    Notes (optional)
                  </div>
                  <input
                    value={trainingNotes}
                    onChange={(e) => setTrainingNotes(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none"
                    placeholder="What should the agent learn from this?"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addTrainingDocMutation.mutate()}
                  disabled={
                    isBusy || !selectedAgentId || !trainingFile || uploadLoading
                  }
                  className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide ${
                    !selectedAgentId || !trainingFile || isBusy
                      ? "bg-black/5 text-black/40"
                      : "bg-black text-white hover:bg-black/90"
                  }`}
                >
                  {uploadLoading || addTrainingDocMutation.isPending
                    ? "Uploading…"
                    : "Upload + attach"}
                </button>

                <div className="text-sm text-black/60">
                  Tip: Add a short note so the judge/agents know what the doc
                  is.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <SectionTitle
                icon={Swords}
                title="Run a match"
                subtitle="Pick two agents, ask a question, get a judged verdict."
              />

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-black/70 mb-1">Agent A</div>
                  <select
                    value={agentAId}
                    onChange={(e) => setAgentAId(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
                  >
                    <option value="">Pick one…</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                        {a.is_public ? " (public)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm text-black/70 mb-1">Agent B</div>
                  <select
                    value={agentBId}
                    onChange={(e) => setAgentBId(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
                  >
                    <option value="">Pick one…</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                        {a.is_public ? " (public)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-black/70 mb-1">Question</div>
                  <textarea
                    value={questionPrompt}
                    onChange={(e) => setQuestionPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 outline-none"
                    rows={4}
                    placeholder="Ask something you want both agents to answer…"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => runMatchMutation.mutate()}
                  disabled={
                    isBusy ||
                    !agentAId ||
                    !agentBId ||
                    !questionPrompt.trim() ||
                    agentAId === agentBId
                  }
                  className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide ${
                    !agentAId ||
                    !agentBId ||
                    !questionPrompt.trim() ||
                    agentAId === agentBId ||
                    isBusy
                      ? "bg-black/5 text-black/40"
                      : "bg-black text-white hover:bg-black/90"
                  }`}
                >
                  {runMatchMutation.isPending ? "Running…" : "Run match"}
                </button>

                <a href="/memory" className="text-sm underline text-black/70">
                  View Memory
                </a>
              </div>

              {latestMatch ? (
                <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
                  <div className="text-base tracking-wide">Latest match</div>
                  <div className="mt-1 text-sm text-black/60">
                    Winner: {latestMatch?.verdict?.winner || "(unknown)"}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-black/10 p-4">
                      <div className="text-sm tracking-wide">Agent A</div>
                      <div className="text-xs text-black/60 mt-1">Response</div>
                      <div className="mt-2 text-sm whitespace-pre-wrap">
                        {latestMatch.agent_a_response}
                      </div>
                    </div>
                    <div className="rounded-xl border border-black/10 p-4">
                      <div className="text-sm tracking-wide">Agent B</div>
                      <div className="text-xs text-black/60 mt-1">Response</div>
                      <div className="mt-2 text-sm whitespace-pre-wrap">
                        {latestMatch.agent_b_response}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-black/10 p-4">
                    <div className="text-sm tracking-wide">Judge verdict</div>
                    <div className="mt-2 text-sm whitespace-pre-wrap">
                      {latestMatch?.verdict?.verdict_summary || ""}
                    </div>
                    <div className="mt-2 text-xs text-black/60 whitespace-pre-wrap">
                      {latestMatch?.verdict?.reasoning || ""}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <SectionTitle
                icon={Trophy}
                title="Recent matches"
                subtitle="Your latest 30 runs (saved)."
              />

              <div className="mt-5 space-y-2">
                {matchesQuery.isLoading ? (
                  <div className="text-sm text-black/60">Loading matches…</div>
                ) : null}

                {matches.length === 0 && !matchesQuery.isLoading ? (
                  <div className="text-sm text-black/60">
                    No matches yet. Run your first one above.
                  </div>
                ) : null}

                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-black/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm tracking-wide">
                          {m.agent_a_name} vs {m.agent_b_name}
                        </div>
                        <div className="text-xs text-black/60 mt-1">
                          {m.question_prompt?.slice(0, 110) || ""}
                          {m.question_prompt?.length > 110 ? "…" : ""}
                        </div>
                      </div>
                      <div className="text-xs rounded-full border border-black/15 px-2 py-1">
                        {m.verdict?.winner || m.winner_name || m.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
