import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  const adminMeQuery = useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      // NOTE: Some deployments have /api/admin-me, others have /api/admin/me.
      // Try the top-level route first, then fall back.
      const tryFetch = async (url) => {
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        return response;
      };

      let response = await tryFetch("/api/admin-me");
      if (response.status === 404) {
        response = await tryFetch("/api/admin/me");
      }

      // Some environments return a 200 with a `null` JSON body when unauthenticated.
      // Treat that the same as a 401 so the UI can recover cleanly.
      if (response.status === 401 || response.status === 403) {
        return {
          isAuthenticated: false,
          isAdmin: false,
          role: null,
          email: null,
        };
      }

      // If neither endpoint exists, treat as signed-out.
      if (response.status === 404) {
        return {
          isAuthenticated: false,
          isAdmin: false,
          role: null,
          email: null,
        };
      }

      if (!response.ok) {
        throw new Error(
          `When fetching admin auth, the response was [${response.status}] ${response.statusText}`,
        );
      }

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // If we can't parse JSON (or body is empty), treat it as unauthenticated.
        data = null;
      }

      if (!data || typeof data !== "object") {
        return {
          isAuthenticated: false,
          isAdmin: false,
          role: null,
          email: null,
        };
      }

      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const adminMe = adminMeQuery.data || null;

  const isCheckingAccess = adminMeQuery.isLoading;

  const accessError = adminMeQuery.error
    ? "Could not verify admin access"
    : null;
  const isAuthenticated = adminMe?.isAuthenticated === true;
  const isAdmin = adminMe?.isAdmin === true;
  const signedInEmail = adminMe?.email || null;

  return {
    isCheckingAccess,
    accessError,
    isAuthenticated,
    isAdmin,
    signedInEmail,
  };
}
