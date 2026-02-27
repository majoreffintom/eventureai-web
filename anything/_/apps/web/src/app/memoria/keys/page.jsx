"use client";

import { useCallback, useMemo, useState } from "react";
import useUser from "@/utils/useUser";
import { useMemoriaAdminStatus } from "@/hooks/useMemoriaAdminStatus";
import { useMemoriaTokens } from "@/hooks/useMemoriaTokens";
import { useCreateMemoriaToken } from "@/hooks/useCreateMemoriaToken";
import { useUpdateMemoriaToken } from "@/hooks/useUpdateMemoriaToken";
import { useMemoriaUpload } from "@/hooks/useMemoriaUpload";
import { PageHeader } from "@/components/MemoriaKeys/PageHeader";
import { AuthStatusBanner } from "@/components/MemoriaKeys/AuthStatusBanner";
import { CreateTokenForm } from "@/components/MemoriaKeys/CreateTokenForm";
import { GeneratedTokenDisplay } from "@/components/MemoriaKeys/GeneratedTokenDisplay";
import { QuickUploadForm } from "@/components/MemoriaKeys/QuickUploadForm";
import { TokenListTable } from "@/components/MemoriaKeys/TokenListTable";

export default function MemoriaKeysPage() {
  const { data: user, loading: userLoading } = useUser();

  const [includeInactive, setIncludeInactive] = useState(true);

  const [newLabel, setNewLabel] = useState("Brother – advanced research");
  const [newAppSource, setNewAppSource] = useState("brother_advanced_research");
  const [newCanRead, setNewCanRead] = useState(true);
  const [newCanWrite, setNewCanWrite] = useState(true);
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [newRateLimit, setNewRateLimit] = useState("120");

  const [generatedToken, setGeneratedToken] = useState(null);
  const [pageError, setPageError] = useState(null);

  const [uploadText, setUploadText] = useState("");
  const [uploadExternalId, setUploadExternalId] = useState(
    "brother_advanced_research:knowledge",
  );

  const [rateLimitEdits, setRateLimitEdits] = useState({});

  const adminStatusQuery = useMemoriaAdminStatus(userLoading);

  const isAuthenticated = Boolean(adminStatusQuery.data?.isAuthenticated);
  const isAdmin = Boolean(adminStatusQuery.data?.isAdmin);

  const tokensQuery = useMemoriaTokens(includeInactive, isAdmin);

  const createTokenMutation = useCreateMemoriaToken(
    isAdmin,
    newLabel,
    newAppSource,
    newCanRead,
    newCanWrite,
    newExpiresAt,
    newRateLimit,
    setPageError,
    setGeneratedToken,
  );

  const updateTokenMutation = useUpdateMemoriaToken(isAdmin, setPageError);

  const uploadAppSource = generatedToken?.appSource || newAppSource;

  const uploadMutation = useMemoriaUpload(
    generatedToken,
    uploadText,
    uploadExternalId,
    uploadAppSource,
    setUploadText,
    setPageError,
  );

  const tokens = tokensQuery.data?.tokens || [];
  const isLoading = tokensQuery.isLoading;

  const hasGeneratedToken = Boolean(generatedToken?.token);

  const curlSnippet = useMemo(() => {
    if (!hasGeneratedToken) return "";

    const tokenString = generatedToken.token;
    const payload = {
      externalId: "brother_advanced_research:thread-1",
      title: "A concept drop",
      index: "Cross_App_Conversations",
      subindex: "brother_advanced_research",
      turn: {
        userText: "Paste the concept here",
        assistantThinkingSummary: "(optional safe summary)",
        assistantSynthesis: "(optional)",
        codeSummary: null,
        assistantResponse: null,
      },
    };

    return `curl -X POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/memoria/external/capture \\\n  -H "Authorization: Bearer ${tokenString}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload, null, 2)}'`;
  }, [generatedToken, hasGeneratedToken]);

  const onCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const onCreate = useCallback(() => {
    if (!isAuthenticated) {
      setPageError("Sign in first.");
      return;
    }

    if (!isAdmin) {
      setPageError(
        "You are signed in, but not a Memoria admin yet. Use the bootstrap step to enable admin for your account.",
      );
      return;
    }
    createTokenMutation.mutate();
  }, [isAuthenticated, isAdmin, createTokenMutation]);

  const onRefresh = useCallback(() => {
    if (!isAdmin) return;
    tokensQuery.refetch();
  }, [isAdmin, tokensQuery]);

  const onDuplicateToken = useCallback(
    (t) => {
      if (!isAdmin) {
        setPageError("You must be a Memoria admin to duplicate tokens.");
        return;
      }
      createTokenMutation.mutate({
        label: t.label || "",
        appSource: t.app_source,
        canRead: Boolean(t.can_read),
        canWrite: Boolean(t.can_write),
        expiresAt: t.expires_at || null,
        rateLimitPerMinute: t.rate_limit_per_minute,
      });
    },
    [isAdmin, createTokenMutation],
  );

  const createBusy = createTokenMutation.isPending;
  const updateBusy = updateTokenMutation.isPending;
  const uploadBusy = uploadMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <PageHeader />

      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AuthStatusBanner
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            user={user}
            includeInactive={includeInactive}
            setIncludeInactive={setIncludeInactive}
            onRefresh={onRefresh}
            isLoading={isLoading}
            tokensQueryError={tokensQuery.error}
            adminStatusQueryError={adminStatusQuery.error}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {pageError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
            {pageError}
          </div>
        )}

        <CreateTokenForm
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          newAppSource={newAppSource}
          setNewAppSource={setNewAppSource}
          newCanRead={newCanRead}
          setNewCanRead={setNewCanRead}
          newCanWrite={newCanWrite}
          setNewCanWrite={setNewCanWrite}
          newExpiresAt={newExpiresAt}
          setNewExpiresAt={setNewExpiresAt}
          newRateLimit={newRateLimit}
          setNewRateLimit={setNewRateLimit}
          onCreate={onCreate}
          isAdmin={isAdmin}
          createBusy={createBusy}
        />

        <GeneratedTokenDisplay
          generatedToken={generatedToken}
          curlSnippet={curlSnippet}
          onCopy={onCopy}
        />

        <QuickUploadForm
          uploadExternalId={uploadExternalId}
          setUploadExternalId={setUploadExternalId}
          uploadText={uploadText}
          setUploadText={setUploadText}
          onUpload={() => uploadMutation.mutate()}
          hasGeneratedToken={hasGeneratedToken}
          uploadBusy={uploadBusy}
        />

        <TokenListTable
          tokens={tokens}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          rateLimitEdits={rateLimitEdits}
          setRateLimitEdits={setRateLimitEdits}
          onUpdateToken={(patch) => updateTokenMutation.mutate(patch)}
          onDuplicateToken={onDuplicateToken}
          updateBusy={updateBusy}
          createBusy={createBusy}
          setPageError={setPageError}
        />
      </div>
    </div>
  );
}
