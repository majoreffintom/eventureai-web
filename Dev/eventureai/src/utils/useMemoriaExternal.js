import { useCallback } from "react";

// Simple helper hook for external Memoria API usage.
// You pass a bearer token (e.g. "memoria.<tokenId>.<secret>") and then call capture/search.
export default function useMemoriaExternal(bearerToken) {
  const capture = useCallback(
    async (payload) => {
      const response = await fetch("/api/memoria/external/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/external/capture, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    [bearerToken],
  );

  const search = useCallback(
    async ({ q, limit }) => {
      const qFinal = String(q || "").trim();
      const limitFinal = typeof limit === "number" ? limit : null;

      const qs = new URLSearchParams();
      qs.set("q", qFinal);
      if (limitFinal) {
        qs.set("limit", String(limitFinal));
      }

      const response = await fetch(
        `/api/memoria/external/search?${qs.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/external/search, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    [bearerToken],
  );

  return { capture, search };
}
