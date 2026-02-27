import { useQuery } from "@tanstack/react-query";

export function useMemoryQueries({ agentName, indexId, subindexId, search }) {
  const agentsQuery = useQuery({
    queryKey: ["aiAgents"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ai-agents");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not load agents");
      }
      return data;
    },
  });

  const indexesQuery = useQuery({
    queryKey: ["memoryIndexes", agentName],
    enabled: !!agentName,
    queryFn: async () => {
      const url = new URL("/api/admin/memory-indexes", window.location.origin);
      url.searchParams.set("agent_name", agentName);
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not load indexes");
      }
      return data;
    },
  });

  const subindexesQuery = useQuery({
    queryKey: ["memorySubindexes", agentName, indexId],
    enabled: !!agentName && !!indexId,
    queryFn: async () => {
      const url = new URL(
        "/api/admin/memory-subindexes",
        window.location.origin,
      );
      url.searchParams.set("agent_name", agentName);
      url.searchParams.set("parent_index_id", indexId);
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not load subindexes");
      }
      return data;
    },
  });

  const contextsQuery = useQuery({
    queryKey: ["memoryContexts", agentName, indexId, subindexId, search],
    enabled: !!agentName,
    queryFn: async () => {
      const url = new URL("/api/admin/memory-contexts", window.location.origin);
      url.searchParams.set("agent_name", agentName);
      if (indexId) {
        url.searchParams.set("parent_index_id", indexId);
      }
      if (subindexId) {
        url.searchParams.set("parent_subindex_id", subindexId);
      }
      if (search.trim()) {
        url.searchParams.set("q", search.trim());
      }
      url.searchParams.set("limit", "100");
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not load memory contexts");
      }
      return data;
    },
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversationsSearch", search],
    queryFn: async () => {
      const url = new URL(
        "/api/admin/conversations/search",
        window.location.origin,
      );
      if (search.trim()) {
        url.searchParams.set("q", search.trim());
      }
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not load conversations");
      }
      return data;
    },
  });

  return {
    agentsQuery,
    indexesQuery,
    subindexesQuery,
    contextsQuery,
    conversationsQuery,
  };
}
