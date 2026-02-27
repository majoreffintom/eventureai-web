"use client";

import { useCallback, useMemo, useState } from "react";
import { Panel, Text } from "@/components/ds.jsx";
import { useSpeechRecognition } from "@/hooks/memory/useSpeechRecognition";
import { useMemoryQueries } from "@/hooks/memory/useMemoryQueries";
import { useMemoryMutations } from "@/hooks/memory/useMemoryMutations";
import { useMemoryOptions } from "@/hooks/memory/useMemoryOptions";
import { safeArray, slugify } from "@/utils/memory/stringUtils";
import { DictationPanel } from "./DictationPanel";
import { FilterControls } from "./FilterControls";
import { MemoryContextsList } from "./MemoryContextsList";
import { ConversationsList } from "./ConversationsList";
import { DraftMemoryForm } from "./DraftMemoryForm";
import { SelectedItemPreview } from "./SelectedItemPreview";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function MemoryTab() {
  const [agentName, setAgentName] = useState("Memoria");
  const [indexId, setIndexId] = useState("");
  const [subindexId, setSubindexId] = useState("");
  const [search, setSearch] = useState("");

  const [dictationSubject, setDictationSubject] = useState("");
  const [dictationSpeaker, setDictationSpeaker] = useState("Josh");
  const [dictationConversationType, setDictationConversationType] =
    useState("efiver-contact");
  const [dictationTags, setDictationTags] = useState(
    "dictation, phone-agent, training",
  );

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedContextId, setSelectedContextId] = useState(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftImportance, setDraftImportance] = useState(7);

  const {
    speechSupported,
    speechError,
    isListening,
    finalTranscript,
    interimTranscript,
    startDictation,
    stopDictation,
    clearDictation,
    setTranscript,
  } = useSpeechRecognition();

  const {
    agentsQuery,
    indexesQuery,
    subindexesQuery,
    contextsQuery,
    conversationsQuery,
  } = useMemoryQueries({ agentName, indexId, subindexId, search });

  const {
    saveDictationAsSessionMutation,
    ingestDictationMutation,
    createContextMutation,
  } = useMemoryMutations({ agentName, indexId, subindexId });

  const queryClient = useQueryClient();

  const [lastRawAssistantText, setLastRawAssistantText] = useState(null);
  const [lastRawSavedLabel, setLastRawSavedLabel] = useState(null);

  // Recent raw dictations (for quick sanity checks)
  const rawContextQuery = useQuery({
    queryKey: ["rawContext", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/admin/raw-context?limit=10");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not load raw dictation history");
      }
      return Array.isArray(data?.rows) ? data.rows : [];
    },
  });

  const saveRawContextMutation = useMutation({
    mutationFn: async ({ raw_text, start_chat }) => {
      const res = await fetch("/api/admin/raw-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text, start_chat }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not save raw dictation");
      }

      return data;
    },
    onSuccess: (data) => {
      const assistantText = data?.assistantText || null;
      const row = data?.row || null;

      setLastRawAssistantText(assistantText);

      if (row?.created_at) {
        const when = new Date(row.created_at);
        setLastRawSavedLabel(
          `Saved to raw_context at ${when.toLocaleString()}`,
        );
      } else {
        setLastRawSavedLabel("Saved to raw_context");
      }

      queryClient.invalidateQueries({ queryKey: ["rawContext"] });
    },
  });

  const agents = safeArray(agentsQuery.data?.agents);
  const indexes = safeArray(indexesQuery.data?.indexes);
  const subindexes = safeArray(subindexesQuery.data?.subindexes);
  const contexts = safeArray(contextsQuery.data?.contexts);
  const conversations = safeArray(conversationsQuery.data?.conversations);

  const {
    conversationTypeOptions,
    agentOptions,
    indexOptions,
    subindexOptions,
  } = useMemoryOptions({ agents, indexes, subindexes });

  const transcriptText = useMemo(() => {
    const combined = `${finalTranscript} ${interimTranscript}`.trim();
    return combined;
  }, [finalTranscript, interimTranscript]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const selectedContext = useMemo(() => {
    if (!selectedContextId) {
      return null;
    }
    return contexts.find((c) => c.id === selectedContextId) || null;
  }, [contexts, selectedContextId]);

  const draftFromConversation = useMemo(() => {
    if (!selectedConversation) {
      return null;
    }

    const tags = safeArray(selectedConversation.tags);

    return {
      related_conversations: [selectedConversation.id],
      tags,
    };
  }, [selectedConversation]);

  const handleSelectConversation = useCallback(
    (id) => {
      setSelectedConversationId(id);
      setSelectedContextId(null);

      const convo = conversations.find((c) => c.id === id) || null;
      if (!convo) {
        return;
      }

      const nextTitle = convo.subject || "";
      const nextSummary = convo.summary || "";
      const nextTags = safeArray(convo.tags).join(", ");

      setDraftTitle(nextTitle);
      setDraftSummary(nextSummary);
      setDraftContent(nextSummary);
      setDraftTags(nextTags);
      setDraftImportance(7);
    },
    [conversations],
  );

  const handleSelectContext = useCallback((id) => {
    setSelectedContextId(id);
    setSelectedConversationId(null);
  }, []);

  const handleAgentChange = useCallback(() => {
    setIndexId("");
    setSubindexId("");
    setSelectedConversationId(null);
    setSelectedContextId(null);
  }, []);

  const handleSaveDictationSession = useCallback(() => {
    const subject = dictationSubject.trim() || "Dictation session";
    const transcript = `${finalTranscript} ${interimTranscript}`.trim();

    saveDictationAsSessionMutation.mutate({
      subject,
      transcript,
      speaker: dictationSpeaker,
      tags: dictationTags,
    });
  }, [
    dictationSubject,
    dictationSpeaker,
    dictationTags,
    finalTranscript,
    interimTranscript,
    saveDictationAsSessionMutation,
  ]);

  const handleIngestDictation = useCallback(() => {
    const subject = dictationSubject.trim();
    const transcript = `${finalTranscript} ${interimTranscript}`.trim();

    ingestDictationMutation.mutate({
      subject,
      transcript,
      speaker: dictationSpeaker,
      tags: dictationTags,
      conversationType: dictationConversationType,
    });
  }, [
    dictationSubject,
    dictationSpeaker,
    dictationTags,
    dictationConversationType,
    finalTranscript,
    interimTranscript,
    ingestDictationMutation,
  ]);

  const handleTranscriptChange = useCallback(
    (e) => {
      setTranscript(e.target.value);
    },
    [setTranscript],
  );

  const saveDraft = useCallback(() => {
    const title = draftTitle.trim();
    if (!title) {
      return;
    }

    const context_name = slugify(title);

    const payload = {
      agent_name: agentName,
      context_name,
      title,
      summary: draftSummary.trim() || null,
      content: draftContent.trim() || null,
      parent_index_id: indexId || null,
      parent_subindex_id: subindexId || null,
      tags: draftTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      importance: draftImportance,
      related_conversations: draftFromConversation?.related_conversations || [],
      metadata: {
        source: selectedConversation ? "conversation" : "manual",
      },
    };

    createContextMutation.mutate(payload);
  }, [
    agentName,
    createContextMutation,
    draftContent,
    draftFromConversation,
    draftImportance,
    draftSummary,
    draftTags,
    draftTitle,
    indexId,
    selectedConversation,
    subindexId,
  ]);

  const handleClearDraft = useCallback(() => {
    setDraftTitle("");
    setDraftSummary("");
    setDraftContent("");
    setDraftTags("");
    setDraftImportance(7);
    setSelectedConversationId(null);
    setSelectedContextId(null);
  }, []);

  const handleSaveRaw = useCallback(() => {
    const raw_text = transcriptText.trim();
    if (!raw_text) {
      return;
    }

    setLastRawAssistantText(null);
    setLastRawSavedLabel(null);

    saveRawContextMutation.mutate({ raw_text, start_chat: false });
  }, [saveRawContextMutation, transcriptText]);

  const handleSaveRawAndAsk = useCallback(() => {
    const raw_text = transcriptText.trim();
    if (!raw_text) {
      return;
    }

    setLastRawAssistantText(null);
    setLastRawSavedLabel(null);

    saveRawContextMutation.mutate({ raw_text, start_chat: true });
  }, [saveRawContextMutation, transcriptText]);

  const errorMessage =
    agentsQuery.error?.message ||
    indexesQuery.error?.message ||
    subindexesQuery.error?.message ||
    contextsQuery.error?.message ||
    conversationsQuery.error?.message ||
    createContextMutation.error?.message ||
    saveDictationAsSessionMutation.error?.message ||
    ingestDictationMutation.error?.message ||
    speechError ||
    rawContextQuery.error?.message ||
    saveRawContextMutation.error?.message ||
    null;

  const isLoading =
    agentsQuery.isLoading ||
    indexesQuery.isLoading ||
    subindexesQuery.isLoading ||
    contextsQuery.isLoading ||
    conversationsQuery.isLoading;

  const saveButtonLabel = useMemo(() => {
    if (createContextMutation.isPending) {
      return "Saving…";
    }
    if (selectedConversation) {
      return "Save as memory";
    }
    return "Save memory";
  }, [createContextMutation.isPending, selectedConversation]);

  const dictationStatusLabel = useMemo(() => {
    if (!speechSupported) {
      return "Dictation not supported in this browser";
    }
    if (isListening) {
      return "Listening…";
    }
    return "Ready";
  }, [isListening, speechSupported]);

  const ingestButtonLabel = useMemo(() => {
    if (ingestDictationMutation.isPending) {
      return "Ingesting…";
    }
    return "Ingest to conversation + memory";
  }, [ingestDictationMutation.isPending]);

  const sessionButtonLabel = useMemo(() => {
    if (saveDictationAsSessionMutation.isPending) {
      return "Saving…";
    }
    return "Save session";
  }, [saveDictationAsSessionMutation.isPending]);

  const rawSaveButtonLabel = useMemo(() => {
    if (saveRawContextMutation.isPending) {
      return "Saving…";
    }
    return "Save raw";
  }, [saveRawContextMutation.isPending]);

  const rawSaveAskButtonLabel = useMemo(() => {
    if (saveRawContextMutation.isPending) {
      return "Saving…";
    }
    return "Save + follow-up";
  }, [saveRawContextMutation.isPending]);

  const rawRows = useMemo(() => {
    return Array.isArray(rawContextQuery.data) ? rawContextQuery.data : [];
  }, [rawContextQuery.data]);

  const recentRawContent = useMemo(() => {
    if (rawContextQuery.isLoading) {
      return (
        <Text tone="tertiary" size="sm">
          Loading…
        </Text>
      );
    }

    if (!rawRows.length) {
      return (
        <Text tone="tertiary" size="sm">
          No raw dictation captured yet.
        </Text>
      );
    }

    return rawRows.map((row) => {
      const whenLabel = row?.created_at
        ? new Date(row.created_at).toLocaleString()
        : null;

      const headerLabel = whenLabel || row.id;

      return (
        <div
          key={row.id}
          className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface)] p-3"
        >
          <Text size="sm" tone="secondary" className="font-semibold">
            {headerLabel}
          </Text>
          <Text size="sm" tone="tertiary" className="mt-1 whitespace-pre-wrap">
            {row.raw_text}
          </Text>
        </div>
      );
    });
  }, [rawContextQuery.isLoading, rawRows]);

  return (
    <div className="space-y-6">
      <Panel
        title="Memory"
        subtitle="Your conversations are the truth. This just turns the best parts into fast-to-recall notes."
      >
        {errorMessage ? <Text tone="danger">{errorMessage}</Text> : null}

        <DictationPanel
          speechSupported={speechSupported}
          isListening={isListening}
          dictationSubject={dictationSubject}
          setDictationSubject={setDictationSubject}
          dictationSpeaker={dictationSpeaker}
          setDictationSpeaker={setDictationSpeaker}
          dictationConversationType={dictationConversationType}
          setDictationConversationType={setDictationConversationType}
          conversationTypeOptions={conversationTypeOptions}
          dictationTags={dictationTags}
          setDictationTags={setDictationTags}
          transcriptText={transcriptText}
          onTranscriptChange={handleTranscriptChange}
          interimTranscript={interimTranscript}
          onStartDictation={startDictation}
          onStopDictation={stopDictation}
          onSaveSession={handleSaveDictationSession}
          onIngest={handleIngestDictation}
          onClear={clearDictation}
          sessionButtonLabel={sessionButtonLabel}
          ingestButtonLabel={ingestButtonLabel}
          dictationStatusLabel={dictationStatusLabel}
          rawSaveButtonLabel={rawSaveButtonLabel}
          rawSaveAskButtonLabel={rawSaveAskButtonLabel}
          onSaveRaw={handleSaveRaw}
          onSaveRawAndAsk={handleSaveRawAndAsk}
          rawAssistantText={lastRawAssistantText}
          rawSavedAtLabel={lastRawSavedLabel}
        />

        {/* Quick view (optional, but helpful): recent raw captures */}
        <div className="mt-4 rounded-2xl border border-[var(--ds-border)] bg-white p-4">
          <Text className="font-semibold">Recent raw captures</Text>
          <Text tone="tertiary" size="sm" className="mt-1">
            This is just a sanity check list (newest first).
          </Text>

          <div className="mt-3 space-y-2">{recentRawContent}</div>
        </div>

        <FilterControls
          agentName={agentName}
          setAgentName={setAgentName}
          agentOptions={agentOptions}
          indexId={indexId}
          setIndexId={setIndexId}
          indexOptions={indexOptions}
          subindexId={subindexId}
          setSubindexId={setSubindexId}
          subindexOptions={subindexOptions}
          search={search}
          setSearch={setSearch}
          onAgentChange={handleAgentChange}
        />

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MemoryContextsList
            contexts={contexts}
            selectedContextId={selectedContextId}
            onSelectContext={handleSelectContext}
            isLoading={isLoading}
          />

          <ConversationsList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoading}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DraftMemoryForm
            draftTitle={draftTitle}
            setDraftTitle={setDraftTitle}
            draftTags={draftTags}
            setDraftTags={setDraftTags}
            draftSummary={draftSummary}
            setDraftSummary={setDraftSummary}
            draftContent={draftContent}
            setDraftContent={setDraftContent}
            draftImportance={draftImportance}
            setDraftImportance={setDraftImportance}
            onSave={saveDraft}
            onClear={handleClearDraft}
            saveButtonLabel={saveButtonLabel}
            showConversationLink={!!draftFromConversation}
          />

          <SelectedItemPreview
            selectedContext={selectedContext}
            selectedConversation={selectedConversation}
          />
        </div>
      </Panel>
    </div>
  );
}
