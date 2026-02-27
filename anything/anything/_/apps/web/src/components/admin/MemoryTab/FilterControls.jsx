import { Input, Select } from "@/components/ds.jsx";

export function FilterControls({
  agentName,
  setAgentName,
  agentOptions,
  indexId,
  setIndexId,
  indexOptions,
  subindexId,
  setSubindexId,
  subindexOptions,
  search,
  setSearch,
  onAgentChange,
}) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
      <Select
        label="Agent"
        value={agentName}
        onChange={(e) => {
          const next = e.target.value;
          setAgentName(next);
          if (onAgentChange) {
            onAgentChange(next);
          }
        }}
        options={agentOptions}
      />

      <Select
        label="Index"
        value={indexId}
        onChange={(e) => {
          const next = e.target.value;
          setIndexId(next);
          setSubindexId("");
        }}
        options={indexOptions}
        disabled={!agentName}
      />

      <Select
        label="Subindex"
        value={subindexId}
        onChange={(e) => setSubindexId(e.target.value)}
        options={subindexOptions}
        disabled={!indexId}
      />

      <Input
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Try: genesis, blacklist, v-loop…"
      />
    </div>
  );
}
