import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUpload from "@/utils/useUpload";

export function useEventureAIDocuments() {
  const queryClient = useQueryClient();
  const [upload, { loading: uploadLoading }] = useUpload();

  const documentsQuery = useQuery({
    queryKey: ["eventureai-documents"],
    queryFn: async () => {
      const response = await fetch("/api/eventureai/documents");
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { unauthorized: true, documents: [] };
      }
      if (!response.ok) {
        throw new Error(
          `When fetching /api/eventureai/documents, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return data;
    },
  });

  const upsertDocumentMutation = useMutation({
    mutationFn: async ({
      docId,
      docTitle,
      docNotes,
      docFile,
      docUrl,
      docMimeType,
      fieldsObject,
    }) => {
      if (!docTitle.trim()) {
        throw new Error("Please enter a title");
      }

      let nextUrl = docUrl;
      let nextMimeType = docMimeType;

      if (docFile) {
        const uploadResult = await upload({ file: docFile });
        if (uploadResult?.error) {
          throw new Error(uploadResult.error);
        }
        nextUrl = uploadResult.url;
        nextMimeType = uploadResult.mimeType;
      }

      const payload = {
        title: docTitle.trim(),
        notes: docNotes?.trim() ? docNotes.trim() : null,
        docUrl: nextUrl,
        docMimeType: nextMimeType,
        fields: fieldsObject,
      };

      const isEdit = !!docId;
      const endpoint = isEdit
        ? `/api/eventureai/documents/${docId}`
        : "/api/eventureai/documents";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error ||
            `When calling ${endpoint}, the response was [${response.status}] ${response.statusText}`,
        );
      }

      return { data, isEdit };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["eventureai-documents"],
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/eventureai/documents/${id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error ||
            `When calling /api/eventureai/documents/${id}, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["eventureai-documents"],
      });
    },
  });

  const exportDocumentMutation = useMutation({
    mutationFn: async ({ id, template }) => {
      if (!id) {
        throw new Error("Missing document id");
      }

      const safeTemplate = template ? String(template) : "";
      const query = safeTemplate
        ? `?template=${encodeURIComponent(safeTemplate)}`
        : "";
      const endpoint = `/api/eventureai/documents/${id}/export${query}`;
      const response = await fetch(endpoint);

      if (response.status === 401) {
        throw new Error("Please sign in to export");
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.error ||
            `When fetching ${endpoint}, the response was [${response.status}] ${response.statusText}`,
        );
      }

      const blob = await response.blob();

      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || "eventureai-export.pdf";

      return { blob, filename };
    },
  });

  return {
    documentsQuery,
    upsertDocumentMutation,
    deleteDocumentMutation,
    exportDocumentMutation,
    uploadLoading,
  };
}
