"use client";

import { useCallback, useState } from "react";
import SiteHeader from "../../../components/SiteHeader";
import {
  Button,
  Input,
  Link,
  Page,
  Panel,
  Text,
} from "../../../components/ds.jsx";

export default function AdminBootstrapPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      if (!email.trim() || !password) {
        setError("Email and password are required");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, role }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const msg = data?.error || `Bootstrap failed (${response.status})`;
          throw new Error(msg);
        }

        setSuccess(
          `Created ${data?.user?.email || "user"} as ${data?.user?.role || role}. You can now sign in.`,
        );
        setPassword("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Bootstrap failed");
      } finally {
        setLoading(false);
      }
    },
    [email, password, role],
  );

  return (
    <Page header={<SiteHeader variant="admin" />} footer={null}>
      <Panel
        title="Create the first admin"
        subtitle="One-time bootstrap (delete later)."
      >
        <Text tone="secondary">
          This page is only meant for the very first user when your auth tables
          are empty. Once you’re in, you should remove/lock this down.
        </Text>

        <div className="mt-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
          <Text tone="primary" className="font-semibold">
            Steps
          </Text>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>Create your first user here (role owner recommended).</li>
            <li>
              Go to <Link href="/account/signin">/account/signin</Link> and sign
              in with the same email/password.
            </li>
            <li>
              Then open <Link href="/admin">/admin</Link>.
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
              Password (min 8 chars)
            </Text>
            <div className="mt-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                inputClassName="h-11"
                type="password"
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
                <option value="owner">owner</option>
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
              {loading ? "Creating…" : "Create first user"}
            </Button>
            <Button as="a" href="/account/signin" variant="secondary">
              Go to sign in
            </Button>
            <Button as="a" href="/admin" variant="secondary">
              Back to /admin
            </Button>
          </div>

          <Text tone="tertiary" size="xs">
            Security note: once you have at least one user, this API route will
            refuse to run (409).
          </Text>
        </form>
      </Panel>
    </Page>
  );
}
