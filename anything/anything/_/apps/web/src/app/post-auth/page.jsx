"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

function roleToPath(role) {
  if (role === "admin" || role === "owner") {
    return "/admin";
  }
  if (role === "technician") {
    return "/tech";
  }
  return "/customer";
}

export default function PostAuthRedirectPage() {
  const hasRedirectedRef = useRef(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);

  const fallbackSignInPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/account/signin";
    }

    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");

    if (from === "admin") {
      // preserve the same flow if the user comes back here again
      return "/admin/login?callbackUrl=%2Fpost-auth%3Ffrom%3Dadmin";
    }

    return "/account/signin";
  }, []);

  const query = useQuery({
    queryKey: ["post-auth", "me"],
    queryFn: async () => {
      const tryFetch = async (url) => {
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        return res;
      };

      let response = await tryFetch("/api/admin-me");
      if (response.status === 404) {
        response = await tryFetch("/api/admin/me");
      }

      // If neither endpoint exists, behave like signed-out and let retries happen.
      if (response.status === 404) {
        return { isAuthenticated: false, role: null };
      }

      // Some environments return 200+null instead of a 401 when not signed in.
      if (response.status === 401 || response.status === 403) {
        return { isAuthenticated: false, role: null };
      }

      if (!response.ok) {
        throw new Error(
          `When fetching post-auth, the response was [${response.status}] ${response.statusText}`,
        );
      }

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!data || typeof data !== "object") {
        return { isAuthenticated: false, role: null };
      }

      const isAuthenticated = data.isAuthenticated === true;
      const role = data.role || null;

      if (!isAuthenticated) {
        return { isAuthenticated: false, role: null };
      }

      return { isAuthenticated: true, role };
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const target = useMemo(() => {
    const role = query.data?.role || null;
    if (!role) {
      return null;
    }
    return roleToPath(role);
  }, [query.data]);

  // If the user just signed in, cookies can take a beat to show up on the next page load.
  // Retry a few times before we send them back to sign-in.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isAuthed = query.data?.isAuthenticated;
    if (query.isLoading || query.isError) {
      return;
    }

    if (isAuthed === false && authRetryCount < 6) {
      const timeout = window.setTimeout(() => {
        setAuthRetryCount((c) => c + 1);
        query.refetch();
      }, 800);

      return () => window.clearTimeout(timeout);
    }
  }, [
    authRetryCount,
    query,
    query.data?.isAuthenticated,
    query.isError,
    query.isLoading,
  ]);

  // We no longer show a "choose where to go" screen here.
  // This route should always auto-route.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (hasRedirectedRef.current) {
      return;
    }

    if (target) {
      hasRedirectedRef.current = true;
      window.location.replace(target);
      return;
    }

    if (
      !query.isLoading &&
      !query.isError &&
      query.data?.isAuthenticated === false
    ) {
      if (authRetryCount >= 6) {
        hasRedirectedRef.current = true;
        window.location.replace(fallbackSignInPath);
      }
    }
  }, [
    authRetryCount,
    fallbackSignInPath,
    query.data?.isAuthenticated,
    query.isError,
    query.isLoading,
    target,
  ]);

  const isLoading = query.isLoading;
  const isAuthed = query.data?.isAuthenticated;

  let body = null;
  if (isLoading) {
    body = "Checking your account…";
  } else if (query.isError) {
    body = "Could not route you after sign-in. Please try again.";
  } else if (isAuthed === false && authRetryCount < 6) {
    body = "Finishing sign-in…";
  } else if (isAuthed === false) {
    body = "Taking you to sign in…";
  } else {
    body = "Taking you to the right place…";
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Redirecting
        </h1>
        <p className="mt-3 text-sm text-gray-600 text-center">{body}</p>
      </div>
    </div>
  );
}
