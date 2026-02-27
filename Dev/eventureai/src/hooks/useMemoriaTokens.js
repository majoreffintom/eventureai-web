import { useQuery } from "@tanstack/react-query";

export function useMemoriaTokens(includeInactive, isAdmin) {
  return useQuery({
    queryKey: ["memoria-api-tokens", includeInactive, isAdmin],
    enabled: isAdmin,
    queryFn: async () => {
      const url = includeInactive
        ? "/api/memoria/keys?includeInactive=true"
        : "/api/memoria/keys";

      const response = await fetch(url, {
        headers: {},
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling ${url}, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
  });
}
