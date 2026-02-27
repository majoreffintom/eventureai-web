import { Text } from "@/components/ds.jsx";

export function ConversationsList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
}) {
  return (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <Text className="font-semibold">Conversations</Text>
      <Text tone="secondary" size="sm" className="mt-1">
        Search or scroll recent. Click one to turn it into memory.
      </Text>

      <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
        {conversations.length ? (
          conversations.map((c) => {
            const isActive = c.id === selectedConversationId;
            const dateText = c.date ? new Date(c.date).toLocaleString() : "";

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectConversation(c.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  isActive
                    ? "border-black bg-white"
                    : "border-[var(--ds-border)] bg-white hover:bg-slate-50"
                }`}
              >
                <Text className="font-medium">{c.subject}</Text>
                {dateText ? (
                  <Text tone="tertiary" size="xs" className="mt-1">
                    {dateText}
                  </Text>
                ) : null}
                {c.summary ? (
                  <Text tone="secondary" size="sm" className="mt-1">
                    {c.summary}
                  </Text>
                ) : null}
              </button>
            );
          })
        ) : isLoading ? (
          <Text tone="secondary">Loading…</Text>
        ) : (
          <Text tone="secondary">No conversations found.</Text>
        )}
      </div>
    </div>
  );
}
