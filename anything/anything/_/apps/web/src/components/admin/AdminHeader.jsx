import { Check, Pencil, RotateCcw } from "lucide-react";
import { Button, Text } from "@/components/ds.jsx";

export function AdminHeader({ editMode, onToggleEditMode, onResetTabs }) {
  const editBtnIcon = editMode ? Check : Pencil;
  const editBtnLabel = editMode ? "Done" : "Edit tabs";

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div>
        <Text as="div" tone="primary" className="font-semibold">
          Goldey Admin
        </Text>
        <Text size="sm" tone="tertiary" className="mt-1">
          Owner dashboard. We'll build each tab one-by-one.
        </Text>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={editMode ? "primary" : "secondary"}
          size="sm"
          icon={editBtnIcon}
          onClick={onToggleEditMode}
        >
          {editBtnLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={onResetTabs}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
