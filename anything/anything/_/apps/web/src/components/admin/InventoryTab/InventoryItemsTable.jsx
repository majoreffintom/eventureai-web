import { useMemo } from "react";
import { Button, Table, Text } from "@/components/ds.jsx";
import { EmptyState } from "@/components/admin/EmptyState";

export function InventoryItemsTable({
  items,
  stockByItemId,
  selectedItemId,
  onSelectItem,
  isLoading,
  error,
}) {
  const itemsColumns = useMemo(() => {
    return [
      {
        key: "name",
        header: "Item",
        render: (row) => {
          const name = row.name || "(Unnamed)";
          const sku = row.sku ? ` • ${row.sku}` : "";
          const unitLine = row.unit ? `Unit: ${row.unit}` : "";
          return (
            <div>
              <div className="text-[var(--ds-text-primary)] font-semibold">
                {name}
              </div>
              <div className="text-xs text-[var(--ds-text-tertiary)]">
                {unitLine}
                {sku}
              </div>
            </div>
          );
        },
      },
      {
        key: "total_quantity",
        header: "Total",
        render: (row) => {
          const val = row.total_quantity;
          return <span>{val}</span>;
        },
      },
      {
        key: "locations",
        header: "By location",
        render: (row) => {
          const rows = stockByItemId.get(row.id) || [];
          if (!rows.length) {
            return <span className="text-[var(--ds-text-tertiary)]">—</span>;
          }

          const chips = rows
            .filter((r) => Number(r.quantity) > 0)
            .map((r) => `${r.location_name}: ${r.quantity}`);

          const display = chips.length ? chips.join(" • ") : "—";
          return <span>{display}</span>;
        },
      },
      {
        key: "actions",
        header: "",
        render: (row) => {
          const isSelected = selectedItemId === row.id;
          const variant = isSelected ? "secondary" : "ghost";

          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant={variant}
                onClick={() => onSelectItem(row.id)}
              >
                Select
              </Button>
            </div>
          );
        },
      },
    ];
  }, [selectedItemId, stockByItemId, onSelectItem]);

  if (error) {
    return <Text tone="danger">Could not load inventory items</Text>;
  }

  if (isLoading) {
    return <Text tone="secondary">Loading inventory…</Text>;
  }

  if (!items.length) {
    return (
      <EmptyState
        title="No inventory items yet"
        body="Add your first item, then receive it into the shop or a truck."
      />
    );
  }

  return <Table columns={itemsColumns} rows={items} />;
}
