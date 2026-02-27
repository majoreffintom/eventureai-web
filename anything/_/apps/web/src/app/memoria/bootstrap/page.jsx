"use client";

import { useCallback, useState } from "react";
import useUser from "@/utils/useUser";

function getErrorMessage(err) {
  if (!err) return "Something went wrong";
  if (typeof err === "string") return err;
  return err?.message || "Something went wrong";
}

export default function MemoriaBootstrapPage() {
  const { data: user, loading } = useUser();

  const [adminKey, setAdminKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onBootstrap = useCallback(async () => {
    setError(null);
    setSuccess(false);

    if (!adminKey.trim()) {
      setError("Paste your Enterprise Admin Key first.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/memoria/admin/bootstrap", {
        method: "POST",
        headers: {
          "X-Admin-Key": adminKey.trim(),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/admin/bootstrap, the response was [${response.status}] ${text}`,
        );
      }

      setSuccess(true);
      if (typeof window !== "undefined") {
        window.location.href = "/memoria/keys";
      }
    } catch (e) {
      console.error(e);
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [adminKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-black/70">Loading…</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-black">
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl tracking-tight">Memoria admin bootstrap</h1>
          <p className="mt-2 text-black/70">
            Sign in first, then come back here to promote yourself as a Memoria
            admin.
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="/account/signin?callbackUrl=/memoria/bootstrap"
              className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-black text-white hover:bg-black/90"
            >
              Sign in
            </a>
            <a
              href="/account/signup?callbackUrl=/memoria/bootstrap"
              className="inline-flex items-center justify-center px-5 py-3 rounded-md border border-black/20 hover:border-black/40"
            >
              Create account
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <a href="/memoria/keys" className="text-sm underline text-black/70">
          Back
        </a>

        <h1 className="mt-6 text-3xl tracking-tight">
          Make yourself a Memoria admin
        </h1>
        <p className="mt-2 text-black/70 leading-relaxed">
          You’re signed in as{" "}
          <span className="font-semibold">{user.email}</span>. To protect
          enterprise access, you must prove you have the Enterprise Admin Key
          once. After that, you won’t need it again.
        </p>

        <div className="mt-6">
          <label className="block text-sm text-black/70">
            Enterprise Admin Key
          </label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Paste ENTERPRISE_MEMORY_KEY"
            className="mt-1 w-full h-11 px-3 rounded-md border border-black/20 focus:border-black/50 outline-none"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Admin enabled.
          </div>
        )}

        <button
          type="button"
          onClick={onBootstrap}
          disabled={busy}
          className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60"
        >
          {busy ? "Enabling…" : "Enable Memoria admin"}
        </button>

        <p className="mt-6 text-sm text-black/60 leading-relaxed">
          Tip: once you’re set up, you can add more admins by inserting emails
          into the{" "}
          <code className="px-1 py-0.5 bg-black/5 rounded">memoria_admins</code>{" "}
          table or we can build a UI for it.
        </p>
      </main>
    </div>
  );
}
