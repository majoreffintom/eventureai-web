import { useCallback, useMemo, useRef } from "react";
import { Pencil } from "lucide-react";
import { Input, Text } from "@/components/ds.jsx";

export function AdminTabsBar({
  tabs,
  activeId,
  onChange,
  onReorder,
  editingId,
  onStartRename,
  onCommitRename,
  onCancelRename,
  editMode,
  hiddenTabIds,
}) {
  const dragIdRef = useRef(null);

  const hiddenSet = useMemo(() => {
    const arr = Array.isArray(hiddenTabIds) ? hiddenTabIds : [];
    return new Set(arr);
  }, [hiddenTabIds]);

  const handleDragStart = useCallback((id) => {
    dragIdRef.current = id;
  }, []);

  const handleDropOn = useCallback(
    (overId) => {
      const activeDragId = dragIdRef.current;
      dragIdRef.current = null;

      if (!activeDragId || activeDragId === overId) {
        return;
      }

      const fromIndex = tabs.findIndex((t) => t.id === activeDragId);
      const toIndex = tabs.findIndex((t) => t.id === overId);

      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      const next = [...tabs];
      const moved = next.splice(fromIndex, 1)[0];
      next.splice(toIndex, 0, moved);
      onReorder(next.map((t) => t.id));
    },
    [onReorder, tabs],
  );

  return (
    <div className="rounded-2xl bg-[var(--ds-surface)] border border-[var(--ds-border)] overflow-x-auto">
      <div className="px-4">
        <div className="flex items-center gap-8">
          {tabs.map((t) => {
            const isHidden = hiddenSet.has(t.id);
            if (isHidden) {
              return null;
            }

            const isActive = activeId === t.id;
            const isEditing = editingId === t.id;
            const Icon = t.icon;

            const activeClasses =
              "border-b-2 border-[var(--ds-brand)] text-[var(--ds-brand)]";
            const inactiveClasses =
              "border-b-2 border-transparent text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] hover:border-[var(--ds-border)]";
            const tabCls = isActive ? activeClasses : inactiveClasses;

            const label = t.label;

            const showRenameBtn = editMode && !isEditing;

            return (
              <div
                key={t.id}
                className="flex items-center"
                draggable={!isEditing}
                onDragStart={() => handleDragStart(t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOn(t.id)}
                title={
                  editMode
                    ? "Drag to reorder (edit mode on)"
                    : "Drag to reorder"
                }
              >
                <button
                  type="button"
                  onClick={() => onChange(t.id)}
                  onDoubleClick={() => onStartRename(t.id)}
                  className={`flex items-center gap-2 px-1 py-4 text-sm font-semibold transition-colors ${tabCls}`}
                >
                  {Icon ? <Icon size={16} /> : null}

                  {isEditing ? (
                    <span className="inline-block min-w-[140px]">
                      <Input
                        value={label}
                        onChange={(e) =>
                          onCommitRename(t.id, e.target.value, false)
                        }
                        onBlur={(e) =>
                          onCommitRename(t.id, e.target.value, true)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onCommitRename(t.id, e.currentTarget.value, true);
                          }
                          if (e.key === "Escape") {
                            onCancelRename();
                          }
                        }}
                        inputClassName="h-9 px-3 rounded-lg"
                      />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{label}</span>
                      {showRenameBtn ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onStartRename(t.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              onStartRename(t.id);
                            }
                          }}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-tertiary)]"
                          aria-label={`Rename ${label} tab`}
                          title="Rename"
                        >
                          <Pencil size={14} />
                        </span>
                      ) : null}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-3">
        <Text size="xs" tone="tertiary">
          Tip: drag tabs to reorder. Double-click a tab name to rename it (or
          turn on Edit tabs).
        </Text>
      </div>
    </div>
  );
}
