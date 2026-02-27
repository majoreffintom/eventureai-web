"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SiteHeader from "../../../components/SiteHeader";
import { Button, Link, Page, Panel, Text } from "../../../components/ds.jsx";

export default function ClaimOwnerPage() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const canRetry = status === "error" || status === "idle";

  const subtitle = useMemo(() => {
    if (status === "loading") return "Claiming owner access…";
    if (status === "success") return "Owner access granted.";
    if (status === "error") return "Could not claim owner access.";
    return "First-time setup";
  }, [status]);

  const claim = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setUser(null);

    try {
      // NOTE: top-level API route (nested /api/admin/* does not deploy reliably)
      const response = await fetch("/api/admin-claim-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setStatus("error");
        setError("Please sign in first, then come back to this page.");
        return;
      }

      if (!response.ok) {
        const msg = data?.error || `Claim failed (${response.status})`;
        throw new Error(msg);
      }

      setUser(data?.user || null);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err?.message || "Claim failed");
    }
  }, []);

  useEffect(() => {
    // Auto-run once.
    claim();
  }, [claim]);

  return (
    <Page header={<SiteHeader variant="admin" />} footer={null}>
      <Panel title="Claim owner access" subtitle={subtitle}>
        <Text tone="secondary">
          This is a one-time helper page. It will promote the currently
          signed-in user to <span className="font-semibold">owner</span> only if
          no owner exists yet.
        </Text>

        {status === "success" ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <Text className="font-semibold" tone="primary">
              You’re in.
            </Text>
            <Text tone="secondary" className="mt-1">
              {user?.email ? (
                <span>
                  Updated <span className="font-semibold">{user.email}</span> to
                  role <span className="font-semibold">{user.role}</span>.
                </span>
              ) : (
                "Your role was updated to owner."
              )}
            </Text>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button as="a" href="/account/logout" variant="secondary">
                Sign out
              </Button>
              <Button as="a" href="/account/signin?callbackUrl=/admin">
                Sign back in
              </Button>
              <Button as="a" href="/admin" variant="secondary">
                Go to /admin
              </Button>
            </div>
            <Text tone="tertiary" size="xs" className="mt-3">
              Tip: signing out/in forces the session to refresh with the new
              role.
            </Text>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <Text className="font-semibold" tone="danger">
              {error || "Claim failed"}
            </Text>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {canRetry ? <Button onClick={claim}>Retry</Button> : null}
              <Button
                as="a"
                href="/account/signin?callbackUrl=/admin/claim"
                variant="secondary"
              >
                Sign in
              </Button>
              <Button as="a" href="/" variant="secondary">
                Back to site
              </Button>
            </div>

            <Text tone="tertiary" size="xs" className="mt-3">
              If you already have an owner/admin in the system, this page will
              refuse to run.
            </Text>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="mt-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
            <Text tone="secondary">Working…</Text>
          </div>
        ) : null}

        <div className="mt-6">
          <Text tone="tertiary" size="xs">
            Need the normal bootstrap flow? Use{" "}
            <Link href="/admin/bootstrap">/admin/bootstrap</Link> (only works if
            there are zero users).
          </Text>
        </div>
      </Panel>
    </Page>
  );
}
