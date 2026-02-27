import { useQuery } from "@tanstack/react-query";

export function useEventureAIConfig() {
  return useQuery({
    queryKey: ["eventureai-config"],
    queryFn: async () => {
      const response = await fetch("/api/eventureai/config");
      const data = await response.json().catch(() => ({}));
      return {
        configured: response.ok && data.configured,
        status: response.status,
        data,
        error: !response.ok
          ? data?.error || "Configuration check failed"
          : null,
      };
    },
  });
}
