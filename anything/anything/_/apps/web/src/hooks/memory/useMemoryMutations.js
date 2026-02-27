import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeContextName, parseTags } from "@/utils/memory/stringUtils";

export function useMemoryMutations({ agentName, indexId, subindexId }) {
  const queryClient = useQueryClient();

  const saveDictationAsSessionMutation = useMutation({
    mutationFn: async ({ subject, transcript, speaker, tags }) => {
      const transcriptText = transcript.trim();

      if (!transcriptText) {
        throw new Error("No dictation captured yet");
      }

      const payload = {
        agent_name: agentName,
        context_name: makeContextName(subject),
        context_type: "note",
        parent_index_id: indexId || null,
        parent_subindex_id: subindexId || null,
        title: subject,
        summary: transcriptText.slice(0, 220) || null,
        content: transcriptText,
        tags: parseTags(tags),
        importance: 6,
        related_conversations: [],
        metadata: {
          source: "dictation",
          stage: "session",
          speaker: speaker.trim() || null,
        },
      };

      const res = await fetch("/api/admin/memory-contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not save session");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memoryContexts"] });
    },
  });

  const ingestDictationMutation = useMutation({
    mutationFn: async ({
      subject,
      transcript,
      speaker,
      tags,
      conversationType,
    }) => {
      const transcriptText = transcript.trim();

      if (!subject) {
        throw new Error("Please set a subject/title");
      }

      if (!transcriptText) {
        throw new Error("No dictation captured yet");
      }

      const tagArray = parseTags(tags);
      const participants = speaker.trim() ? [speaker.trim()] : [];

      const convoRes = await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          summary: transcriptText,
          conversation_type: conversationType,
          tags: tagArray,
          participants,
          status: "completed",
        }),
      });

      const convoData = await convoRes.json().catch(() => null);
      if (!convoRes.ok) {
        throw new Error(convoData?.error || "Could not create conversation");
      }

      const conversationId = convoData?.id;
      if (!conversationId) {
        throw new Error("Conversation created without an id");
      }

      const ctxPayload = {
        agent_name: agentName,
        context_name: makeContextName(subject),
        context_type: "knowledge",
        parent_index_id: indexId || null,
        parent_subindex_id: subindexId || null,
        title: subject,
        summary: transcriptText.slice(0, 220) || null,
        content: transcriptText,
        tags: tagArray,
        importance: 8,
        related_conversations: [conversationId],
        metadata: {
          source: "dictation",
          speaker: speaker.trim() || null,
        },
      };

      const ctxRes = await fetch("/api/admin/memory-contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctxPayload),
      });

      const ctxData = await ctxRes.json().catch(() => null);
      if (!ctxRes.ok) {
        throw new Error(ctxData?.error || "Could not save memory context");
      }

      return { conversationId, contextId: ctxData?.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversationsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["memoryContexts"] });
    },
  });

  const createContextMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/memory-contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not save memory context");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memoryContexts"] });
    },
  });

  return {
    saveDictationAsSessionMutation,
    ingestDictationMutation,
    createContextMutation,
  };
}
