import { Button, Input, Select, Text } from "@/components/ds.jsx";

export function QuickMovementForm({
  movement,
  setMovement,
  movementTypeOptions,
  itemOptions,
  locationOptions,
  refTypeOptions,
  canSubmit,
  isPending,
  onSubmit,
  onReset,
  onItemSelected,
}) {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <Text className="font-semibold" tone="primary">
        Quick movement
      </Text>
      <Text size="sm" tone="tertiary" className="mt-1">
        Use this when an order is received, parts move between shop/trucks, or
        items are used on an invoice/job.
      </Text>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          label="Type"
          value={movement.movement_type}
          onChange={(e) => {
            const nextType = e.target.value;
            setMovement((p) => {
              const base = { ...p, movement_type: nextType };
              if (nextType === "receive") {
                return { ...base, from_location_id: "" };
              }
              if (nextType === "use") {
                return { ...base, to_location_id: "" };
              }
              return base;
            });
          }}
          options={movementTypeOptions}
        />

        <Select
          label="Item"
          value={movement.item_id}
          onChange={(e) => {
            const id = e.target.value;
            if (typeof onItemSelected === "function") {
              onItemSelected(id);
            }
            setMovement((p) => ({ ...p, item_id: id }));
          }}
          options={itemOptions}
        />

        <Input
          label="Quantity"
          value={movement.quantity}
          onChange={(e) =>
            setMovement((p) => ({ ...p, quantity: e.target.value }))
          }
          type="number"
          min="0"
          step="1"
        />

        {movement.movement_type !== "receive" ? (
          <Select
            label="From"
            value={movement.from_location_id}
            onChange={(e) =>
              setMovement((p) => ({
                ...p,
                from_location_id: e.target.value,
              }))
            }
            options={locationOptions}
          />
        ) : null}

        {movement.movement_type !== "use" ? (
          <Select
            label="To"
            value={movement.to_location_id}
            onChange={(e) =>
              setMovement((p) => ({ ...p, to_location_id: e.target.value }))
            }
            options={locationOptions}
          />
        ) : null}

        <Select
          label="Reference"
          value={movement.reference_type}
          onChange={(e) =>
            setMovement((p) => ({ ...p, reference_type: e.target.value }))
          }
          options={refTypeOptions}
        />

        <Input
          label="Reference ID (optional UUID)"
          value={movement.reference_id}
          onChange={(e) =>
            setMovement((p) => ({ ...p, reference_id: e.target.value }))
          }
          placeholder="invoice/job id (optional)"
        />

        <Input
          label="Notes"
          value={movement.notes}
          onChange={(e) =>
            setMovement((p) => ({ ...p, notes: e.target.value }))
          }
          placeholder="optional"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={onSubmit}
          disabled={!canSubmit || isPending}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
