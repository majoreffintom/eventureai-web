import { Save, X } from "lucide-react";

export function SecretFormModal({
  editingSecret,
  secretFormData,
  setSecretFormData,
  onSave,
  onClose,
  isSaving,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-lg text-[#0F172A] dark:text-white">
            {editingSecret ? "Update Secret" : "Add New Secret"}
          </h4>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#0F172A] dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
              Secret Key
            </label>
            <input
              type="text"
              value={secretFormData.secret_key}
              onChange={(e) =>
                setSecretFormData({
                  ...secretFormData,
                  secret_key: e.target.value,
                })
              }
              placeholder="STRIPE_SECRET_KEY"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:bg-gray-800 dark:text-white"
              disabled={editingSecret} // Don't allow changing key on edit
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
              Secret Value
            </label>
            <textarea
              value={secretFormData.secret_value}
              onChange={(e) =>
                setSecretFormData({
                  ...secretFormData,
                  secret_value: e.target.value,
                })
              }
              placeholder="sk_live_..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:bg-gray-800 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
              Description
            </label>
            <input
              type="text"
              value={secretFormData.description}
              onChange={(e) =>
                setSecretFormData({
                  ...secretFormData,
                  description: e.target.value,
                })
              }
              placeholder="Stripe API key for payments"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={secretFormData.is_required}
                onChange={(e) =>
                  setSecretFormData({
                    ...secretFormData,
                    is_required: e.target.checked,
                  })
                }
                className="rounded"
              />
              <span className="text-sm text-[#0F172A] dark:text-white">
                Required
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={
                !secretFormData.secret_key ||
                !secretFormData.secret_value ||
                isSaving
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-lg hover:bg-[#17233A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Secret"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-[#0F172A] dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
