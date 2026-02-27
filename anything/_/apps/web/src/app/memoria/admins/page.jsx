"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import { useMemoriaAdminStatus } from "@/hooks/useMemoriaAdminStatus";

function getErrorMessage(err) {
  if (!err) return null;
  if (typeof err === "string") return err;
  return err?.message || "Something went wrong";
}

export default function MemoriaAdminsPage() {
  const { data: user, loading: userLoading } = useUser();
  const adminStatusQuery = useMemoriaAdminStatus(userLoading);

  const isAuthenticated = Boolean(adminStatusQuery.data?.isAuthenticated);
  const isAdmin = Boolean(adminStatusQuery.data?.isAdmin);

  const queryClient = useQueryClient();

  const [newEmail, setNewEmail] = useState("");
  const [pageError, setPageError] = useState(null);

  const adminsQuery = useQuery({
    queryKey: ["memoria-admins"],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await fetch("/api/memoria/admins");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/admins, the response was [${response.status}] ${text}`,
        );
      }
      return response.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!isAdmin) {
        throw new Error("You must be a Memoria admin to add admins.");
      }

      const email = newEmail.trim().toLowerCase();
      if (!email) {
        throw new Error("Enter an email first.");
      }

      const response = await fetch("/api/memoria/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/admins (POST), the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onMutate: () => {
      setPageError(null);
    },
    onSuccess: () => {
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["memoria-admins"] });
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (email) => {
      if (!isAdmin) {
        throw new Error("You must be a Memoria admin to remove admins.");
      }

      const response = await fetch("/api/memoria/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/admins (DELETE), the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onMutate: () => {
      setPageError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memoria-admins"] });
    },
    onError: (e) => {
      console.error(e);
      setPageError(getErrorMessage(e));
    },
  });

  const admins = adminsQuery.data?.admins || [];
  const isLoading = adminsQuery.isLoading;

  const selfEmail = user?.email || null;

  const banner = useMemo(() => {
    if (!isAuthenticated) {
      return {
        tone: "bg-gray-50 border-black/10",
        title: "Sign in required",
        body: "Sign in to manage Memoria admins.",
      };
    }

    if (!isAdmin) {
      return {
        tone: "bg-gray-50 border-black/10",
        title: "Signed in (not admin yet)",
        body: "To manage admins, first enable Memoria admin for your account.",
      };
    }

    return {
      tone: "bg-green-50 border-green-200",
      title: "Memoria admin",
      body: "You can add/remove admin emails here.",
    };
  }, [isAuthenticated, isAdmin]);

  const onAdd = useCallback(() => {
    addMutation.mutate();
  }, [addMutation]);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-black/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <a
                href="/memoria/keys"
                className="text-sm underline text-black/70"
              >
                Back to keys
              </a>
              <h1 className="mt-3 text-3xl tracking-tight">Memoria Admins</h1>
              <p className="mt-2 text-black/70">
                This controls who can create/revoke API tokens and manage
                enterprise Memoria access.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/memoria/keys"
                className="h-[40px] px-4 rounded-lg border border-black/15 bg-white inline-flex items-center justify-center"
              >
                Keys
              </a>
              <a
                href="/memoria/uploader"
                className="h-[40px] px-4 rounded-lg border border-black/15 bg-white inline-flex items-center justify-center"
              >
                Uploader
              </a>
              <a
                href="/memory"
                className="h-[40px] px-4 rounded-lg border border-black/15 bg-white inline-flex items-center justify-center"
              >
                Open Memory
              </a>
              <a
                href="/memoria/admins/agreements"
                className="h-[40px] px-4 rounded-lg border border-black/15 bg-white inline-flex items-center justify-center"
              >
                Agreements
              </a>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-xl border ${banner.tone}`}>
            <div className="text-sm font-semibold">{banner.title}</div>
            <div className="mt-1 text-sm text-black/70">{banner.body}</div>

            <div className="mt-2 text-sm text-black/70">
              {user?.email ? (
                <div>
                  Signed in as{" "}
                  <span className="font-semibold">{user.email}</span>.{" "}
                  <a className="underline" href="/account/logout">
                    Sign out
                  </a>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <a
                    className="underline"
                    href="/account/signin?callbackUrl=/memoria/admins"
                  >
                    Sign in
                  </a>
                  <a
                    className="underline"
                    href="/account/signup?callbackUrl=/memoria/admins"
                  >
                    Create account
                  </a>
                </div>
              )}
            </div>

            {isAuthenticated && !isAdmin && (
              <div className="mt-3">
                <a
                  href="/memoria/bootstrap"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-black text-white"
                >
                  Enable Memoria admin
                </a>
              </div>
            )}
          </div>

          {(pageError || adminsQuery.error || adminStatusQuery.error) && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {getErrorMessage(
                pageError || adminsQuery.error || adminStatusQuery.error,
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-black/10 p-5">
            <h2 className="text-lg font-semibold">Add admin</h2>
            <p className="mt-1 text-sm text-black/70">
              Add an email address to allow that person to manage Memoria keys.
            </p>

            <div className="mt-4">
              <label className="block text-sm text-black/70">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 w-full h-11 px-3 rounded-md border border-black/20 focus:border-black/50 outline-none"
                disabled={!isAdmin || addMutation.isPending}
              />
            </div>

            <button
              type="button"
              onClick={onAdd}
              disabled={!isAdmin || addMutation.isPending}
              className="mt-4 inline-flex items-center justify-center px-5 py-3 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60"
            >
              {addMutation.isPending ? "Adding…" : "Add admin"}
            </button>

            <p className="mt-4 text-sm text-black/60 leading-relaxed">
              Tip: keep at least two admins to avoid lockouts.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 p-5">
            <h2 className="text-lg font-semibold">Current admins</h2>
            <p className="mt-1 text-sm text-black/70">
              Only these emails can create/revoke API tokens.
            </p>

            <div className="mt-4">
              {!isAdmin ? (
                <div className="text-sm text-black/60">
                  You must be a Memoria admin to view the admin list.
                </div>
              ) : isLoading ? (
                <div className="text-sm text-black/60">Loading…</div>
              ) : admins.length === 0 ? (
                <div className="text-sm text-black/60">
                  No admins found (this is unusual). Try refreshing.
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((a) => {
                    const email = a.email;
                    const isSelf = selfEmail && email === selfEmail;
                    const createdAt = a.created_at
                      ? new Date(a.created_at).toLocaleString()
                      : "";

                    return (
                      <div
                        key={email}
                        className="flex items-start justify-between gap-3 rounded-xl border border-black/10 p-3"
                      >
                        <div>
                          <div className="text-sm font-semibold">{email}</div>
                          <div className="mt-1 text-xs text-black/60">
                            Added {createdAt}
                            {a.created_by_email
                              ? ` • by ${a.created_by_email}`
                              : ""}
                            {isSelf ? " • (you)" : ""}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(email)}
                          disabled={
                            !isAdmin || removeMutation.isPending || isSelf
                          }
                          className="h-10 px-3 rounded-lg border border-black/15 bg-white text-sm disabled:opacity-50"
                          title={
                            isSelf
                              ? "For safety, self-removal is disabled in the UI."
                              : "Remove admin"
                          }
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
