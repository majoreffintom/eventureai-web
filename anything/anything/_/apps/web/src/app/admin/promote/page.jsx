"use client";

import { useCallback, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Button, Input, Link, Page, Panel, Text } from "@/components/ds.jsx";

export default function AdminPromotePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("owner");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const roleLabel = useMemo(() => {
    if (role === "admin") return "admin";
    if (role === "technician") return "technician";
    if (role === "customer") return "customer";
    return "owner";
  }, [role]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      const trimmedEmail = String(email || "").trim();

      if (!trimmedEmail) {
        setError("Email is required");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/admin/promote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, role }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `Promote failed (${response.status})`);
        }

        setSuccess(
          `Updated ${data?.user?.email || trimmedEmail} to role ${data?.user?.role || roleLabel}.`,
        );
      } catch (err) {
        console.error(err);
        setError(err?.message || "Promote failed");
      } finally {
        setLoading(false);
      }
    },
    [email, role, roleLabel],
  );

  return (
    <Page header={<SiteHeader variant="admin" />} footer={null}>
      <Panel title="Admin role change" subtitle="Owner/admin only.">
        <Text tone="secondary">
          This page requires you to be signed in as an{" "}
          <span className="font-semibold">owner</span> or{" "}
          <span className="font-semibold">admin</span>. If you don’t have an
          owner yet, use <Link href="/admin/claim">/admin/claim</Link>.
        </Text>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Text tone="primary" className="font-semibold">
            If you get "Unauthorized"
          </Text>
          <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-amber-900">
            <li>
              Sign in at <Link href="/admin/login">/admin/login</Link>.
            </li>
            <li>
              If there is no owner account yet, visit{" "}
              <Link href="/admin/claim">/admin/claim</Link>.
            </li>
          </ol>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Text as="label" tone="secondary" size="sm">
              Email
            </Text>
            <div className="mt-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                inputClassName="h-11"
              />
            </div>
          </div>

          <div>
            <Text as="label" tone="secondary" size="sm">
              Role
            </Text>
            <div className="mt-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 text-sm"
              >
                <option value="owner">owner (owners only can grant)</option>
                <option value="admin">admin</option>
                <option value="technician">technician</option>
                <option value="customer">customer</option>
              </select>
            </div>
          </div>

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
              {loading ? "Updating…" : "Update role"}
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
