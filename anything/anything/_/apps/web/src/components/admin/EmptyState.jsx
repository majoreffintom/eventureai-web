import { Text } from "@/components/ds.jsx";

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--ds-border)] p-6 text-center">
      <Text as="div" tone="primary" className="font-semibold">
        {title}
      </Text>
      <Text size="sm" tone="tertiary" className="mt-2">
        {body}
      </Text>
    </div>
  );
}
