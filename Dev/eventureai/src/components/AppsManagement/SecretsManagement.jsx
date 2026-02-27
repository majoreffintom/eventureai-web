import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { SecretFormModal } from "./SecretFormModal";

export function SecretsManagement({
  selectedApp,
  secretsData,
  secretsLoading,
  saveSecretMutation,
  deleteSecretMutation,
}) {
  const [showAddSecret, setShowAddSecret] = useState(false);
  const [editingSecret, setEditingSecret] = useState(null);
  const [secretFormData, setSecretFormData] = useState({
    secret_key: "",
    secret_value: "",
    description: "",
    is_required: true,
    environment: "production",
    expires_at: "",
  });

  const handleSaveSecret = () => {
    const data = {
      app_id: selectedApp.id,
      ...secretFormData,
    };
    saveSecretMutation.mutate(data, {
      onSuccess: () => {
        setShowAddSecret(false);
        setEditingSecret(null);
        setSecretFormData({
          secret_key: "",
          secret_value: "",
          description: "",
          is_required: true,
          environment: "production",
          expires_at: "",
        });
      },
    });
  };

  const handleEditSecret = (secret) => {
    setEditingSecret(secret);
    setSecretFormData({
      secret_key: secret.secret_key,
      secret_value: "", // Don't pre-populate for security
      description: secret.description || "",
      is_required: secret.is_required,
      environment: secret.environment,
      expires_at: secret.expires_at || "",
    });
    setShowAddSecret(true);
  };

  const handleDeleteSecret = (secretId) => {
    if (confirm("Are you sure you want to delete this secret?")) {
      deleteSecretMutation.mutate(secretId);
    }
  };

  const handleCloseModal = () => {
    setShowAddSecret(false);
    setEditingSecret(null);
    setSecretFormData({
      secret_key: "",
      secret_value: "",
      description: "",
      is_required: true,
      environment: "production",
      expires_at: "",
    });
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
            Secrets Management
          </h3>
          <p className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
            Manage API keys and environment variables for {selectedApp.name}
          </p>
        </div>
        <button
          onClick={() => setShowAddSecret(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-lg hover:bg-[#17233A] transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Secret
        </button>
      </div>

      {/* Secrets Table */}
      {secretsLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-[#0F172A] dark:text-white">
                  Key
                </th>
                <th className="text-left py-3 px-4 font-medium text-[#0F172A] dark:text-white">
                  Description
                </th>
                <th className="text-left py-3 px-4 font-medium text-[#0F172A] dark:text-white">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-[#0F172A] dark:text-white">
                  Last Updated
                </th>
                <th className="text-right py-3 px-4 font-medium text-[#0F172A] dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {secretsData?.secrets?.length > 0 ? (
                secretsData.secrets.map((secret) => (
                  <tr
                    key={secret.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {secret.secret_key}
                        </code>
                        {secret.is_required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#667085] dark:text-[#A1A1AA]">
                      {secret.description || "No description"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          secret.has_value
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {secret.has_value ? "Set" : "Empty"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#667085] dark:text-[#A1A1AA]">
                      {secret.last_rotated
                        ? new Date(secret.last_rotated).toLocaleDateString()
                        : new Date(secret.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditSecret(secret)}
                          className="p-1 text-[#667085] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSecret(secret.id)}
                          className="p-1 text-[#667085] hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[#667085] dark:text-[#A1A1AA]"
                  >
                    No secrets configured. Click "Add Secret" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Secret Form */}
      {showAddSecret && (
        <SecretFormModal
          editingSecret={editingSecret}
          secretFormData={secretFormData}
          setSecretFormData={setSecretFormData}
          onSave={handleSaveSecret}
          onClose={handleCloseModal}
          isSaving={saveSecretMutation.isPending}
        />
      )}
    </div>
  );
}
