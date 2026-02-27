import { Text } from "@/components/ds.jsx";

export function SelectedItemPreview({ selectedContext, selectedConversation }) {
  return (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-white p-4">
      <Text className="font-semibold">Selected</Text>

      {selectedContext ? (
        <div className="mt-2">
          <Text className="font-medium">{selectedContext.title}</Text>
          {selectedContext.summary ? (
            <Text tone="secondary" size="sm" className="mt-1">
              {selectedContext.summary}
            </Text>
          ) : null}
          {selectedContext.content ? (
            <Text tone="secondary" size="sm" className="mt-3">
              {selectedContext.content}
            </Text>
          ) : null}
        </div>
      ) : selectedConversation ? (
        <div className="mt-2">
          <Text className="font-medium">{selectedConversation.subject}</Text>
          {selectedConversation.summary ? (
            <Text tone="secondary" size="sm" className="mt-1">
              {selectedConversation.summary}
            </Text>
          ) : null}
          <Text tone="tertiary" size="xs" className="mt-3">
            Tip: click "Save as memory" to turn this into a fast recall note.
          </Text>
        </div>
      ) : (
        <Text tone="secondary" className="mt-2">
          Click a conversation or memory note.
        </Text>
      )}
    </div>
  );
}
