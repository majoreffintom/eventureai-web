import { useMemo } from "react";
import { Table, Text } from "@/components/ds.jsx";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  formatMovementType,
  formatRefType,
} from "@/utils/inventory/formatters";

export function MovementsTable({ movements, isLoading, error }) {
  const movementColumns = useMemo(() => {
    return [
      {
        key: "occurred_at",
        header: "When",
        render: (r) => {
          const d = r.occurred_at ? new Date(r.occurred_at) : null;
          const s = d ? d.toLocaleString() : "";
          return <span>{s}</span>;
        },
      },
      {
        key: "movement_type",
        header: "Type",
        render: (r) => <span>{formatMovementType(r.movement_type)}</span>,
      },
      {
        key: "item_name",
        header: "Item",
        render: (r) => <span>{r.item_name || ""}</span>,
      },
      {
        key: "locations",
        header: "From → To",
        render: (r) => {
          const from = r.from_location_name || "";
          const to = r.to_location_name || "";

          let display = "";
          if (r.movement_type === "receive") {
            display = `→ ${to}`;
          } else if (r.movement_type === "use") {
            display = `${from} →`;
          } else {
            display = `${from} → ${to}`;
          }

          return <span>{display}</span>;
        },
      },
      {
        key: "quantity",
        header: "Qty",
        render: (r) => <span>{r.quantity}</span>,
      },
      {
        key: "reference_type",
        header: "Ref",
        render: (r) => {
          const label = formatRefType(r.reference_type);
          const hasId = !!r.reference_id;
          const display = label ? (hasId ? `${label} #` : label) : "";
          return <span>{display}</span>;
        },
      },
    ];
  }, []);

  if (error) {
    return <Text tone="danger">Could not load movements</Text>;
  }

  if (isLoading) {
    return <Text tone="secondary">Loading activity…</Text>;
  }

  if (!movements.length) {
    return (
      <EmptyState
        title="No activity yet"
        body="Once you receive, use, or transfer items, you'll see it here."
      />
    );
  }

  return <Table columns={movementColumns} rows={movements} />;
}
