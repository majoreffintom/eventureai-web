"use client";

import { useCallback, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Button, Link, Page, Panel, Text } from "@/components/ds.jsx";

export default function AdminResetAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      const response = await fetch("/api/admin/reset-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          normalizeEmails: true,
          clearSessions: true,
          clearVerificationTokens: true,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || `Reset failed (${response.status})`;

        if (response.status === 409 && data?.duplicates?.length) {
          const sample = data.duplicates
            .slice(0, 5)
            .map((d) => `${d.email} (${d.count})`)
            .join(", ");
          throw new Error(`${msg} Example duplicates: ${sample}`);
        }

        throw new Error(msg);
      }

      setSuccess(
        `Done. Normalized ${data?.emailsNormalized ?? 0} email(s) and cleared ${data?.sessionsDeleted ?? 0} session(s).`,
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Page header={<SiteHeader variant="admin" />} footer={null}>
      <Panel
        title="Reset auth (safe)"
        subtitle="Owner only. Clears sessions and normalizes emails without touching business data."
      >
        <Text tone="secondary">
          This page requires you to be signed in as{" "}
          <span className="font-semibold">owner</span>. If you don’t have an
          owner yet, sign in and use{" "}
          <Link href="/admin/claim">/admin/claim</Link>.
        </Text>

        <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>forces all auth emails to lowercase (prevents case bugs)</li>
          <li>deletes all auth sessions (everyone is signed out)</li>
          <li>clears verification tokens</li>
        </ul>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Text tone="primary" className="font-semibold">
            After running this
          </Text>
          <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-amber-900">
            <li>
              Go to <Link href="/account/logout">/account/logout</Link>.
            </li>
            <li>
              Sign in again at <Link href="/admin/login">/admin/login</Link>.
            </li>
          </ol>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset auth"}
            </Button>
            <Button as="a" href="/admin/login" variant="secondary">
              Go to /admin/login
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <Text tone="tertiary" size="xs">
            Note: we no longer use a shared secret key for this page. It’s
            protected by your login session.
          </Text>
        </div>
      </Panel>
    </Page>
  );
}
