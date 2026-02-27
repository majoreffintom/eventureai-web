import { Button, Input, Text } from "@/components/ds.jsx";

export function DraftMemoryForm({
  draftTitle,
  setDraftTitle,
  draftTags,
  setDraftTags,
  draftSummary,
  setDraftSummary,
  draftContent,
  setDraftContent,
  draftImportance,
  setDraftImportance,
  onSave,
  onClear,
  saveButtonLabel,
  showConversationLink,
}) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-[var(--ds-border)] bg-white p-4">
      <Text className="font-semibold">Draft memory</Text>
      <Text tone="secondary" size="sm" className="mt-1">
        This is the "quick recall" card: short title, short summary, and a
        little detail.
      </Text>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Title"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="e.g. Three strike system"
        />
        <Input
          label="Tags (comma separated)"
          value={draftTags}
          onChange={(e) => setDraftTags(e.target.value)}
          placeholder="ethics-code, blacklist, genesis"
        />
      </div>

      <div className="mt-3">
        <Input
          label="Summary"
          value={draftSummary}
          onChange={(e) => setDraftSummary(e.target.value)}
          placeholder="One sentence you can read in 3 seconds."
        />
      </div>

      <div className="mt-3">
        <Text tone="secondary" size="sm" as="label">
          Content (optional)
        </Text>
        <textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3 text-sm"
          placeholder="Paste details here. Keep it short and useful."
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Importance (1-10)"
          type="number"
          value={draftImportance}
          onChange={(e) => setDraftImportance(e.target.value)}
          min={1}
          max={10}
        />

        <div className="flex items-end gap-2">
          <Button onClick={onSave} disabled={!draftTitle.trim()}>
            {saveButtonLabel}
          </Button>
          <Button variant="secondary" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {showConversationLink ? (
        <Text tone="tertiary" size="xs" className="mt-3">
          Linked to 1 conversation (so later we can jump back to the full
          story).
        </Text>
      ) : null}
    </div>
  );
}
