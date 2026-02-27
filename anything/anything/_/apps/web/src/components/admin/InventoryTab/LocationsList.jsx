import { Text } from "@/components/ds.jsx";

export function LocationsList({ locations, isLoading, error }) {
  if (error) {
    return <Text tone="danger">Could not load locations</Text>;
  }

  if (isLoading) {
    return <Text tone="secondary">Loading locations…</Text>;
  }

  if (!locations.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <Text className="font-semibold" tone="primary">
        Locations
      </Text>
      <Text size="sm" tone="tertiary" className="mt-1">
        Start with Goldey Shop + your trucks. Add more shops or trucks any time.
      </Text>
      <div className="mt-3 flex flex-wrap gap-2">
        {locations.map((l) => (
          <span
            key={l.id}
            className="text-xs px-3 py-1 rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text-secondary)]"
          >
            {l.name}
          </span>
        ))}
      </div>
    </div>
  );
}
