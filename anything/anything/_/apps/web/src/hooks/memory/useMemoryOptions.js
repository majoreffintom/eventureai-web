import { useMemo } from "react";
import { safeArray } from "@/utils/memory/stringUtils";

export function useMemoryOptions({ agents, indexes, subindexes }) {
  const conversationTypeOptions = useMemo(() => {
    return [
      { value: "efiver-contact", label: "efiver-contact" },
      { value: "technical", label: "technical" },
      { value: "brainstorm", label: "brainstorm" },
      { value: "casual", label: "casual" },
    ];
  }, []);

  const agentOptions = useMemo(() => {
    return safeArray(agents).map((a) => ({
      value: a.agent_name,
      label: a.agent_name,
    }));
  }, [agents]);

  const indexOptions = useMemo(() => {
    const base = [{ value: "", label: "(No index)" }];
    const rest = safeArray(indexes).map((i) => ({
      value: i.id,
      label: i.display_name || i.index_name,
    }));
    return [...base, ...rest];
  }, [indexes]);

  const subindexOptions = useMemo(() => {
    const base = [{ value: "", label: "(No subindex)" }];
    const rest = safeArray(subindexes).map((s) => ({
      value: s.id,
      label: s.display_name || s.subindex_name,
    }));
    return [...base, ...rest];
  }, [subindexes]);

  return {
    conversationTypeOptions,
    agentOptions,
    indexOptions,
    subindexOptions,
  };
}
