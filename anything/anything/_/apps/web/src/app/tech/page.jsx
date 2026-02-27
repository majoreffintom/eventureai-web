"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { Button, Page, Panel, Text } from "../../components/ds.jsx";

export default function TechPortalPage() {
  const query = useQuery({
    queryKey: ["tech", "me"],
    queryFn: async () => {
      // NOTE: top-level API route (nested /api/admin/* does not deploy reliably)
      const response = await fetch("/api/admin-me", { credentials: "include" });
      if (response.status === 401) {
        return { isAuthenticated: false, role: null };
      }
      if (!response.ok) {
        throw new Error(
          `When fetching /api/admin-me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    retry: false,
  });

  const state = useMemo(() => {
    if (query.isLoading) {
      return { title: "Tech portal", subtitle: "Loading…" };
    }
    if (query.isError) {
      return {
        title: "Tech portal",
        subtitle: "Could not load your account details.",
      };
    }
    if (!query.data?.isAuthenticated) {
      return {
        title: "Tech portal",
        subtitle: "Please sign in to view your current job.",
      };
    }

    const role = query.data?.role || "customer";
    if (role !== "technician") {
      return {
        title: "Tech portal",
        subtitle:
          "Your account isn’t marked as a technician. If this is wrong, an admin can update your role.",
      };
    }

    return {
      title: "Tech portal",
      subtitle:
        "This is the technician landing page. Next we’ll show only your current job + barcode/photo proof.",
    };
  }, [query.data, query.isError, query.isLoading]);

  const showSignIn = query.data?.isAuthenticated === false;
  const showRedirect =
    query.data?.isAuthenticated &&
    query.data?.role &&
    query.data.role !== "technician";

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      title={state.title}
      subtitle={state.subtitle}
    >
      <Panel>
        <Text tone="primary" className="font-semibold">
          Coming next
        </Text>
        <ul className="mt-3 list-disc pl-5 text-sm text-[var(--ds-text-secondary)]">
          <li>Current job only (no other techs, no past jobs unless repeat)</li>
          <li>Scan barcode of installed parts</li>
          <li>Upload proof photos of replaced/installed parts</li>
          <li>Map: only today’s customers for your route</li>
        </ul>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          {showSignIn ? (
            <Button as="a" href="/account/signin?callbackUrl=/tech">
              Sign in
            </Button>
          ) : null}

          {showRedirect ? (
            <Button as="a" href="/customer" variant="secondary">
              Go to my portal
            </Button>
          ) : null}

          <Button as="a" href="/" variant="secondary">
            Back to site
          </Button>
        </div>
      </Panel>
    </Page>
  );
}
