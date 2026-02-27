import { Text } from "@/components/ds.jsx";
import { safeArray } from "@/utils/memory/stringUtils";

export function MemoryContextsList({
  contexts,
  selectedContextId,
  onSelectContext,
  isLoading,
}) {
  return (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <Text className="font-semibold">Memory contexts</Text>
      <Text tone="secondary" size="sm" className="mt-1">
        High-importance notes you can skim in seconds.
      </Text>

      <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
        {contexts.length ? (
          contexts.map((ctx) => {
            const isActive = ctx.id === selectedContextId;
            const tags = safeArray(ctx.tags);
            const tagText = tags.slice(0, 4).join(" • ");
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => onSelectContext(ctx.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  isActive
                    ? "border-black bg-white"
                    : "border-[var(--ds-border)] bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Text className="font-medium">{ctx.title}</Text>
                  <Text size="xs" tone="tertiary">
                    {ctx.importance ? `★ ${ctx.importance}` : null}
                  </Text>
                </div>
                {ctx.summary ? (
                  <Text tone="secondary" size="sm" className="mt-1">
                    {ctx.summary}
                  </Text>
                ) : null}
                {tagText ? (
                  <Text tone="tertiary" size="xs" className="mt-2">
                    {tagText}
                  </Text>
                ) : null}
              </button>
            );
          })
        ) : isLoading ? (
          <Text tone="secondary">Loading…</Text>
        ) : (
          <Text tone="secondary">
            No memory contexts yet. Pick a conversation and hit "Save as
            memory".
          </Text>
        )}
      </div>
    </div>
  );
}
