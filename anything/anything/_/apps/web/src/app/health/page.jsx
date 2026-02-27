"use client";

import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Page, Panel, Text } from "@/components/ds.jsx";

export default function HealthPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch("/api/health", { method: "GET" });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/health, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    retry: false,
  });

  const isLoading = healthQuery.isLoading;
  const error = healthQuery.error;
  const data = healthQuery.data || null;

  const pretty = data ? JSON.stringify(data, null, 2) : "";

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      contentClassName="pt-6"
    >
      <Panel
        title="System health"
        subtitle="This page helps debug preview/live issues."
      >
        {isLoading ? (
          <Text>Checking…</Text>
        ) : error ? (
          <Text tone="danger">Could not load health check.</Text>
        ) : (
          <div>
            <Text tone={data?.ok ? "primary" : "danger"}>
              Overall status: {data?.ok ? "OK" : "NOT OK"}
            </Text>

            <div className="mt-4">
              <Text size="sm" tone="tertiary">
                If this says NOT OK, open the JSON below and send it to me.
              </Text>
            </div>

            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg-tertiary)] p-4 text-xs text-[var(--ds-text-secondary)]">
              {pretty}
            </pre>
          </div>
        )}

        {error ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg-tertiary)] p-4 text-xs text-[var(--ds-text-secondary)]">
            {String(error?.message || error)}
          </pre>
        ) : null}
      </Panel>
    </Page>
  );
}
