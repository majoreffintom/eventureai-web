import { useQuery, useMutation } from "@tanstack/react-query";

export function useAppSecrets(selectedApp) {
  const {
    data: secretsData,
    isLoading: secretsLoading,
    refetch: refetchSecrets,
  } = useQuery({
    queryKey: ["app-secrets", selectedApp?.id],
    queryFn: async () => {
      if (!selectedApp) return null;
      const response = await fetch(
        `/api/apps/secrets/manage?app_id=${selectedApp.id}&environment=production`,
      );
      if (!response.ok) throw new Error("Failed to fetch secrets");
      return response.json();
    },
    enabled: !!selectedApp,
  });

  const saveSecretMutation = useMutation({
    mutationFn: async (secretData) => {
      const response = await fetch("/api/apps/secrets/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(secretData),
      });
      if (!response.ok) throw new Error("Failed to save secret");
      return response.json();
    },
    onSuccess: () => {
      refetchSecrets();
    },
  });

  const deleteSecretMutation = useMutation({
    mutationFn: async (secretId) => {
      const response = await fetch(
        `/api/apps/secrets/manage?secret_id=${secretId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Failed to delete secret");
      return response.json();
    },
    onSuccess: () => {
      refetchSecrets();
    },
  });

  return {
    secretsData,
    secretsLoading,
    refetchSecrets,
    saveSecretMutation,
    deleteSecretMutation,
  };
}
