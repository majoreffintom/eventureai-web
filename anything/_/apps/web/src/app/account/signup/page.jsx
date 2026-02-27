"use client";

import { useCallback, useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";

function getErrorMessage(err) {
  if (!err) return "Something went wrong";
  if (typeof err === "string") return err;
  return err?.message || "Something went wrong";
}

export default function SignUpPage() {
  const { signUpWithCredentials } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const q = new URLSearchParams(window.location.search);
    return q.get("callbackUrl") || "/";
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !password) {
        setError("Please fill in email and password.");
        return;
      }

      setLoading(true);
      try {
        await signUpWithCredentials({
          email: email.trim(),
          password,
          callbackUrl,
          redirect: true,
        });
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
        setLoading(false);
      }
    },
    [email, password, callbackUrl, signUpWithCredentials],
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <a href="/" className="text-sm underline text-black/70">
          Back
        </a>

        <h1 className="mt-6 text-3xl tracking-tight">Create account</h1>
        <p className="mt-2 text-black/70">
          This account is used to manage Memoria keys and enterprise settings.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label className="block text-sm text-black/70">Email</label>
            <input
              className="mt-1 w-full h-11 px-3 rounded-md border border-black/20 focus:border-black/50 outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-black/70">Password</label>
            <input
              className="mt-1 w-full h-11 px-3 rounded-md border border-black/20 focus:border-black/50 outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          <div className="text-sm text-black/70">
            Already have an account?{" "}
            <a
              href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="underline"
            >
              Sign in
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
