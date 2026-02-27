"use client";

import { useState, useEffect } from "react";
import { useEventureAIConfig } from "@/hooks/useEventureAIConfig";
import { useEventureAIDocuments } from "@/hooks/useEventureAIDocuments";
import { useEventureAIMemories } from "@/hooks/useEventureAIMemories";
import { useEventureAICron } from "@/hooks/useEventureAICron";
import { useDocumentForm } from "@/hooks/useDocumentForm";
import { PageHeader } from "@/components/EventureAI/PageHeader";
import { DocumentsSection } from "@/components/EventureAI/DocumentsSection";
import { ConfigurationSetup } from "@/components/EventureAI/ConfigurationSetup";
import { MemoryTypeSelector } from "@/components/EventureAI/MemoryTypeSelector";
import { AddMemoryForm } from "@/components/EventureAI/AddMemoryForm";
import { MemoriesList } from "@/components/EventureAI/MemoriesList";
import { AutomationPanel } from "@/components/EventureAI/AutomationPanel";
import { CronTestResults } from "@/components/EventureAI/CronTestResults";
import { StatusPanel } from "@/components/EventureAI/StatusPanel";

export default function EventureAIPage() {
  const [selectedMemoryType, setSelectedMemoryType] = useState("app");
  const [newMemory, setNewMemory] = useState("");
  const [cronTestResult, setCronTestResult] = useState(null);

  const configCheck = useEventureAIConfig();

  const {
    documentsQuery,
    upsertDocumentMutation,
    deleteDocumentMutation,
    exportDocumentMutation,
    uploadLoading,
  } = useEventureAIDocuments();

  const {
    docId,
    setDocId,
    docTitle,
    setDocTitle,
    docNotes,
    setDocNotes,
    docUrl,
    setDocUrl,
    docMimeType,
    setDocMimeType,
    docFile,
    setDocFile,
    docFields,
    setDocFields,
    docError,
    setDocError,
    docSuccess,
    setDocSuccess,
    fieldsObject,
    clearDocForm,
  } = useDocumentForm();

  const { memoriesQuery, addMemoryMutation } = useEventureAIMemories(
    selectedMemoryType,
    configCheck.data?.configured,
  );

  const { testCronMutation } = useEventureAICron();

  useEffect(() => {
    if (upsertDocumentMutation.isSuccess) {
      const isEdit = !!docId;
      setDocSuccess(isEdit ? "Saved" : "Created");
      if (!isEdit) {
        clearDocForm();
      }
    }
  }, [upsertDocumentMutation.isSuccess, docId, clearDocForm]);

  useEffect(() => {
    if (upsertDocumentMutation.isError) {
      setDocError(
        upsertDocumentMutation.error?.message || "Could not save document",
      );
    }
  }, [upsertDocumentMutation.isError, upsertDocumentMutation.error]);

  useEffect(() => {
    if (deleteDocumentMutation.isSuccess && docId) {
      clearDocForm();
    }
  }, [deleteDocumentMutation.isSuccess, docId, clearDocForm]);

  useEffect(() => {
    if (deleteDocumentMutation.isError) {
      setDocError(
        deleteDocumentMutation.error?.message || "Could not delete document",
      );
    }
  }, [deleteDocumentMutation.isError, deleteDocumentMutation.error]);

  useEffect(() => {
    if (addMemoryMutation.isSuccess) {
      setNewMemory("");
    }
  }, [addMemoryMutation.isSuccess]);

  useEffect(() => {
    if (testCronMutation.isSuccess) {
      setCronTestResult(testCronMutation.data);
    }
  }, [testCronMutation.isSuccess, testCronMutation.data]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <PageHeader configCheck={configCheck} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DocumentsSection
          docId={docId}
          docTitle={docTitle}
          setDocTitle={setDocTitle}
          docNotes={docNotes}
          setDocNotes={setDocNotes}
          docUrl={docUrl}
          docMimeType={docMimeType}
          docFile={docFile}
          setDocFile={setDocFile}
          docFields={docFields}
          setDocFields={setDocFields}
          docError={docError}
          docSuccess={docSuccess}
          clearDocForm={clearDocForm}
          documentsQuery={documentsQuery}
          upsertDocumentMutation={upsertDocumentMutation}
          deleteDocumentMutation={deleteDocumentMutation}
          exportDocumentMutation={exportDocumentMutation}
          uploadLoading={uploadLoading}
          setDocId={setDocId}
          setDocUrl={setDocUrl}
          setDocMimeType={setDocMimeType}
          setDocError={setDocError}
          setDocSuccess={setDocSuccess}
        />

        {!configCheck.data?.configured ? (
          <ConfigurationSetup configCheck={configCheck} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <MemoryTypeSelector
                selectedMemoryType={selectedMemoryType}
                setSelectedMemoryType={setSelectedMemoryType}
              />

              <AddMemoryForm
                newMemory={newMemory}
                setNewMemory={setNewMemory}
                selectedMemoryType={selectedMemoryType}
                addMemoryMutation={addMemoryMutation}
              />

              <MemoriesList
                memoriesQuery={memoriesQuery}
                selectedMemoryType={selectedMemoryType}
              />
            </div>

            <div className="space-y-6">
              <AutomationPanel
                testCronMutation={testCronMutation}
                selectedMemoryType={selectedMemoryType}
              />

              <CronTestResults cronTestResult={cronTestResult} />

              <StatusPanel selectedMemoryType={selectedMemoryType} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
