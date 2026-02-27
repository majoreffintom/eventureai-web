"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import useUser from "@/utils/useUser";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminGate({ children }) {
  const { data: user, loading: userLoading } = useUser();
  const [pathname, setPathname] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPathname(window.location.pathname || "/");
  }, []);

  const isRestrictedRoute = useMemo(() => {
    if (!pathname) return false;

    // Public / customer-facing routes
    if (pathname === "/") return false;
    if (pathname.startsWith("/about")) return false;
    if (pathname.startsWith("/account")) return false;
    if (pathname.startsWith("/services")) return false;
    if (pathname.startsWith("/tournament")) return false;

    // Memoria read/write demo page (login required inside page)
    if (pathname.startsWith("/memoria/conversations")) return false;

    // Enterprise conversation importer + master tasklist (login required inside page)
    if (pathname.startsWith("/enterprise")) return false;

    // Everything else is admin-only
    return true;
  }, [pathname]);

  const adminStatusQuery = useQuery({
    queryKey: ["memoria-admin-status"],
    enabled: Boolean(isRestrictedRoute),
    queryFn: async () => {
      const response = await fetch("/api/memoria/admin/me");
      if (!response.ok) {
        throw new Error(
          `When fetching /api/memoria/admin/me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  if (!isRestrictedRoute) {
    return children;
  }

  const isLoading = userLoading || adminStatusQuery.isLoading;
  const isAdmin = Boolean(adminStatusQuery.data?.isAdmin);

  if (isLoading || pathname === null) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-black/10 bg-white p-6">
          <div className="text-lg tracking-wide">Loading…</div>
          <div className="mt-2 text-sm text-black/60">
            Checking your access.
          </div>
        </div>
      </div>
    );
  }

  if (adminStatusQuery.isError) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6">
          <div className="text-lg tracking-wide text-red-700">
            Could not verify access
          </div>
          <div className="mt-2 text-sm text-black/70">
            Please refresh. If this keeps happening, check server logs.
          </div>
          <div className="mt-4 flex gap-3">
            <a className="px-4 py-2 rounded-md bg-black text-white" href="/">
              Go home
            </a>
            <a
              className="px-4 py-2 rounded-md border border-black/20"
              href="/account/signin"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return children;
  }

  // Not an admin.
  if (!user) {
    const callbackUrl = encodeURIComponent(pathname || "/");
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-black/10 bg-white p-6">
          <div className="text-lg tracking-wide">Sign in required</div>
          <div className="mt-2 text-sm text-black/70">
            This page is private. Sign in to continue.
          </div>
          <div className="mt-4 flex gap-3">
            <a
              className="px-4 py-2 rounded-md bg-black text-white"
              href={`/account/signin?callbackUrl=${callbackUrl}`}
            >
              Sign in
            </a>
            <a className="px-4 py-2 rounded-md border border-black/20" href="/">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-black/10 bg-white p-6">
        <div className="text-lg tracking-wide">Admins only</div>
        <div className="mt-2 text-sm text-black/70">
          You’re signed in, but this area is restricted to admins.
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <a className="px-4 py-2 rounded-md bg-black text-white" href="/">
            Go home
          </a>
          <a
            className="px-4 py-2 rounded-md border border-black/20"
            href="/account/logout"
          >
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="min-h-screen bg-[#F2F2F7] text-[#111111]"
        style={{ WebkitFontSmoothing: "antialiased" }}
      >
        {/* Root background is iOS-style “grouped” gray. Individual pages render white cards on top. */}
        <AdminGate>{children}</AdminGate>
      </div>
    </QueryClientProvider>
  );
}
