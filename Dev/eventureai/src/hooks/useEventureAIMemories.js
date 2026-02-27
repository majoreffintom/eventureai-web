import { useQuery, useMutation } from "@tanstack/react-query";

export function useEventureAIMemories(selectedMemoryType, isConfigured) {
  const memoriesQuery = useQuery({
    queryKey: ["eventureai-memories", selectedMemoryType],
    queryFn: async () => {
      const response = await fetch(
        `/api/eventureai/memories?type=${selectedMemoryType}`,
      );
      if (!response.ok) throw new Error("Failed to fetch memories");
      return response.json();
    },
    enabled: isConfigured,
  });

  const addMemoryMutation = useMutation({
    mutationFn: async ({ memory, type }) => {
      const response = await fetch("/api/eventureai/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memory,
          type,
          context: {
            source: "manual_entry",
            timestamp: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to add memory");
      return response.json();
    },
    onSuccess: () => {
      memoriesQuery.refetch();
    },
  });

  return {
    memoriesQuery,
    addMemoryMutation,
  };
}
