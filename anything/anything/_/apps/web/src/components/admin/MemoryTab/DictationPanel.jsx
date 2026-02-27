import { Mic, Square, Save, MessageSquareText } from "lucide-react";
import { Button, Input, Select, Text } from "@/components/ds.jsx";

export function DictationPanel({
  speechSupported,
  isListening,
  dictationSubject,
  setDictationSubject,
  dictationSpeaker,
  setDictationSpeaker,
  dictationConversationType,
  setDictationConversationType,
  conversationTypeOptions,
  dictationTags,
  setDictationTags,
  transcriptText,
  onTranscriptChange,
  interimTranscript,
  onStartDictation,
  onStopDictation,
  onSaveSession,
  onIngest,
  onClear,
  sessionButtonLabel,
  ingestButtonLabel,
  dictationStatusLabel,

  // Optional: quick raw capture into raw_context
  onSaveRaw,
  onSaveRawAndAsk,
  rawSaveButtonLabel,
  rawSaveAskButtonLabel,
  rawAssistantText,
  rawSavedAtLabel,
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--ds-border)] bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Text className="font-semibold">Dictation (speech → text)</Text>
          <Text tone="secondary" size="sm" className="mt-1">
            Josh can dictate here, then you can file it into Index/Subindex and
            save it into Conversations + MemoryContext.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Text size="sm" tone="tertiary">
            {dictationStatusLabel}
          </Text>

          <Button
            variant={isListening ? "secondary" : "primary"}
            size="sm"
            icon={Mic}
            onClick={onStartDictation}
            disabled={!speechSupported || isListening}
          >
            Start
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Square}
            onClick={onStopDictation}
            disabled={!speechSupported || !isListening}
          >
            Stop
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="Subject"
          value={dictationSubject}
          onChange={(e) => setDictationSubject(e.target.value)}
          placeholder="e.g. How Josh answers after-hours calls"
        />

        <Input
          label="Speaker"
          value={dictationSpeaker}
          onChange={(e) => setDictationSpeaker(e.target.value)}
          placeholder="Josh"
        />

        <Select
          label="Conversation type"
          value={dictationConversationType}
          onChange={(e) => setDictationConversationType(e.target.value)}
          options={conversationTypeOptions}
        />
      </div>

      <div className="mt-3">
        <Input
          label="Tags (comma separated)"
          value={dictationTags}
          onChange={(e) => setDictationTags(e.target.value)}
          placeholder="dictation, phone-agent, training"
        />
      </div>

      <div className="mt-3">
        <Text tone="secondary" size="sm" as="label">
          Transcript
        </Text>
        <textarea
          value={transcriptText}
          onChange={onTranscriptChange}
          rows={5}
          className="mt-2 w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3 text-sm"
          placeholder={
            speechSupported
              ? "Click Start and speak…"
              : "Speech-to-text is not supported in this browser. You can still paste text here."
          }
        />
        {interimTranscript ? (
          <Text tone="tertiary" size="xs" className="mt-2">
            Live: {interimTranscript}
          </Text>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onSaveSession} disabled={!transcriptText}>
          {sessionButtonLabel}
        </Button>
        <Button onClick={onIngest} disabled={!transcriptText}>
          {ingestButtonLabel}
        </Button>
        <Button variant="secondary" onClick={onClear}>
          Clear
        </Button>
      </div>

      {onSaveRaw ? (
        <div className="mt-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-3">
          <Text className="font-semibold" size="sm">
            Raw capture (raw_context)
          </Text>
          <Text tone="tertiary" size="xs" className="mt-1">
            Saves the transcript exactly as-is so you can process it later.
          </Text>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Save}
              onClick={onSaveRaw}
              disabled={!transcriptText}
            >
              {rawSaveButtonLabel || "Save raw"}
            </Button>

            {onSaveRawAndAsk ? (
              <Button
                variant="secondary"
                size="sm"
                icon={MessageSquareText}
                onClick={onSaveRawAndAsk}
                disabled={!transcriptText}
              >
                {rawSaveAskButtonLabel || "Save + follow-up"}
              </Button>
            ) : null}
          </div>

          {rawSavedAtLabel ? (
            <Text tone="tertiary" size="xs" className="mt-2">
              {rawSavedAtLabel}
            </Text>
          ) : null}

          {rawAssistantText ? (
            <Text tone="secondary" size="sm" className="mt-2">
              Assistant: {rawAssistantText}
            </Text>
          ) : null}
        </div>
      ) : null}

      <Text tone="tertiary" size="xs" className="mt-3">
        Tip: pick Agent/Index/Subindex above before ingesting so this lands in
        the right place.
      </Text>
    </div>
  );
}
