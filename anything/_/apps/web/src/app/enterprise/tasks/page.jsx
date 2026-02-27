"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react";
import useUser from "@/utils/useUser";

function Card({ children }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6">
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const label = status || "";
  const base = "text-xs rounded-full border px-2 py-1";

  if (label === "done")
    return (
      <span className={`${base} border-green-200 text-green-700`}>done</span>
    );
  if (label === "blocked")
    return (
      <span className={`${base} border-red-200 text-red-700`}>blocked</span>
    );
  if (label === "in_progress")
    return (
      <span className={`${base} border-blue-200 text-blue-700`}>
        in progress
      </span>
    );

  return <span className={`${base} border-black/15 text-black/70`}>todo</span>;
}

export default function EnterpriseTasksPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [appKey, setAppKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Default new task app is now EventureAI
  const [newAppKey, setNewAppKey] = useState("eventureai");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const callbackUrl = useMemo(
    () => encodeURIComponent("/enterprise/tasks"),
    [],
  );

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

  const tasksQuery = useQuery({
    queryKey: ["enterprise-tasks", appKey, statusFilter],
    enabled: Boolean(user),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appKey) params.set("app_key", appKey);
      if (statusFilter) params.set("status", statusFilter);

      const url = `/api/enterprise/tasks?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `When fetching ${url}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/enterprise/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: newAppKey,
          title: newTitle,
          description: newDescription,
          priority: newPriority,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When posting /api/enterprise/tasks, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-tasks"] });
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setSuccess("Task created");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not create task");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch(`/api/enterprise/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When patching /api/enterprise/tasks/${id}, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-tasks"] });
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not update task");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/enterprise/tasks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When deleting /api/enterprise/tasks/${id}, the response was [${res.status}] ${text}`,
        );
      }

      return res.json();
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-tasks"] });
      setSuccess("Task deleted");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not delete task");
    },
  });

  const tasks = tasksQuery.data?.tasks || [];

  const busy =
    userLoading ||
    bootstrapQuery.isLoading ||
    bootstrapQuery.isFetching ||
    tasksQuery.isLoading ||
    tasksQuery.isFetching ||
    createTaskMutation.isPending;

  const onCreate = useCallback(() => {
    if (!newTitle.trim()) return;
    createTaskMutation.mutate();
  }, [newTitle, createTaskMutation]);

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
                <ListTodo size={18} />
              </div>
              <div>
                <div className="text-xl tracking-wide">Master Tasklist</div>
                <div className="text-sm text-black/60">
                  Sign in to view and manage tasks across your apps.
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

  const createDisabled = busy || !newAppKey || !newTitle.trim();

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
            <ListTodo size={18} />
          </div>
          <div className="flex-1">
            <div className="text-xl tracking-wide">Master Tasklist</div>
            <div className="text-sm text-black/60">
              One task list across eventureai, ditzl, lumina, rosebud, resty,
              memoria, chainy, nifty.
            </div>
          </div>
          <a
            href="/enterprise/import"
            className="px-4 py-2 rounded-full active:scale-95 transition-transform text-sm"
            style={{
              backgroundColor: "rgba(255,255,255,0.70)",
              border: "1px solid rgba(0,0,0,0.10)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 20px rgba(0,0,0,0.06)",
            }}
          >
            Import conversations
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
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
            <CheckCircle2 size={16} className="mt-0.5" />
            <div className="text-sm text-green-800">{success}</div>
          </div>
        ) : null}

        <Card>
          <div className="text-lg tracking-wide">Add a task</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-black/70 mb-1">App</div>
              <select
                value={newAppKey}
                onChange={(e) => setNewAppKey(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
              >
                {apps.length === 0 ? (
                  <option value="eventureai">eventureai</option>
                ) : null}
                {apps.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm text-black/70 mb-1">Priority</div>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-black/70 mb-1">Title</div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl border border-black/15 outline-none"
                placeholder="What needs to get done?"
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-black/70 mb-1">Description</div>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/15 outline-none"
                rows={3}
                placeholder="Optional details"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onCreate}
              disabled={createDisabled}
              className={`h-[44px] px-5 rounded-xl border border-black/15 tracking-wide flex items-center gap-2 ${
                createDisabled
                  ? "bg-black/5 text-black/40"
                  : "bg-black text-white hover:bg-black/90"
              }`}
            >
              <Plus size={16} />
              {createTaskMutation.isPending ? "Creating…" : "Create task"}
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg tracking-wide">Tasks</div>
              <div className="text-sm text-black/60 mt-1">
                Live read from Postgres via{" "}
                <span className="font-mono">/api/enterprise/tasks</span>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                className="h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
              >
                <option value="">All apps</option>
                {apps.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[42px] px-3 rounded-xl border border-black/15 outline-none bg-white"
              >
                <option value="">All status</option>
                <option value="todo">todo</option>
                <option value="in_progress">in progress</option>
                <option value="blocked">blocked</option>
                <option value="done">done</option>
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {tasksQuery.isError ? (
              <div className="text-sm text-red-700">
                Could not load tasks. Check server logs.
              </div>
            ) : null}

            {!tasksQuery.isLoading && tasks.length === 0 ? (
              <div className="text-sm text-black/60">No tasks yet.</div>
            ) : null}

            {tasks.map((t) => {
              const titleLabel = t.title || "(untitled)";
              const desc = t.description || "";
              const pill = t.status || "todo";
              const isDone = t.status === "done";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-black/10 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm tracking-wide truncate">
                          {titleLabel}
                        </div>
                        <StatusPill status={pill} />
                        <div className="text-xs text-black/50 rounded-full border border-black/10 px-2 py-1">
                          {t.app_key}
                        </div>
                      </div>
                      {desc ? (
                        <div className="mt-2 text-sm text-black/70 whitespace-pre-wrap">
                          {desc}
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-black/50">
                        Priority: {t.priority}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: t.id,
                            status: isDone ? "todo" : "done",
                          })
                        }
                        className="px-3 py-2 rounded-md border border-black/20 hover:border-black/40 text-sm"
                        disabled={updateStatusMutation.isPending}
                      >
                        {isDone ? "Reopen" : "Done"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTaskMutation.mutate({ id: t.id })}
                        className="px-3 py-2 rounded-md border border-black/20 hover:border-black/40 text-sm"
                        disabled={deleteTaskMutation.isPending}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="text-sm text-black/60">
          If you want, I can add: assignment to teammates, due dates, and a
          “link back to source conversation” button.
        </div>
      </div>
    </div>
  );
}
