"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle } from "lucide-react";
import MarketingHeader from "@/components/Marketing/MarketingHeader";

export default function BetaPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && email.includes("@");
  }, [email]);

  const signupMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const response = await fetch("/api/beta/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim() || null,
          company: company.trim() || null,
          notes: notes.trim() || null,
          source: "website_beta_page",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When posting /api/beta/waitlist, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (e) => {
      console.error(e);
      setError("Could not join the beta. Please try again.");
    },
  });

  const onSubmit = useCallback(() => {
    if (!canSubmit || signupMutation.isPending) {
      return;
    }
    signupMutation.mutate();
  }, [canSubmit, signupMutation]);

  return (
    <div className="bg-white text-black min-h-screen">
      <MarketingHeader current="beta" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl tracking-tight">Beta access</h1>
          <p className="mt-4 text-black/70 leading-relaxed">
            Tell me where you want this to go. I’ll prioritize your setup and
            start pulling context across your apps.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-xl border border-black/10 p-6">
            {success ? (
              <div className="flex items-start gap-3">
                <CheckCircle size={22} className="mt-0.5" />
                <div>
                  <div className="text-xl">You’re on the list.</div>
                  <div className="mt-2 text-black/70">
                    Next: I’ll send you the exact keys/endpoints to plug into
                    your apps.
                  </div>
                  <div className="mt-5">
                    <a
                      href="/"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-black/20 hover:border-black/40"
                    >
                      Back to the homepage
                      <ArrowRight size={18} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-lg">Join the beta</div>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <div className="text-sm text-black/70 mb-1">Email *</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-black/15 focus:outline-none focus:border-black/40"
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm text-black/70 mb-1">Name</div>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-black/15 focus:outline-none focus:border-black/40"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm text-black/70 mb-1">Company</div>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-black/15 focus:outline-none focus:border-black/40"
                      placeholder="Company / product"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm text-black/70 mb-1">
                      What should EventureAI automate for you?
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-black/15 focus:outline-none focus:border-black/40"
                      placeholder="Example: capture all conversations from DITZL + auto-sync nightly"
                      rows={4}
                    />
                  </label>

                  {error && <div className="text-sm text-red-600">{error}</div>}

                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || signupMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-50"
                  >
                    {signupMutation.isPending ? "Saving..." : "Join beta"}
                    <ArrowRight size={18} />
                  </button>

                  <div className="text-xs text-black/60 leading-relaxed">
                    We’ll only use this to contact you about access and setup.
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-black/10 p-6">
            <div className="text-lg">What you’ll get</div>
            <ul className="mt-4 space-y-3 text-black/70">
              <li>• A cross-app memory hub with secure capture endpoints</li>
              <li>• A one-line drop-in saver for web or mobile</li>
              <li>• Scheduled sync (nightly/weekly) so you never forget</li>
              <li>• A simple dashboard to confirm it’s actually working</li>
            </ul>

            <div className="mt-6 rounded-lg border border-black/10 p-4 text-sm text-black/70">
              If you already have app URLs, I can set up endpoints + keys for
              each one and start pulling data immediately.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
