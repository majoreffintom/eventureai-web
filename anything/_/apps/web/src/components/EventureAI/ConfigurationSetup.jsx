import { Key, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export function ConfigurationSetup({ configCheck }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-8">
      <div className="text-center">
        <Key size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-[#0F172A] dark:text-white mb-2">
          EventureAI Configuration Required
        </h2>
        <p className="text-[#667085] dark:text-[#A1A1AA] mb-6">
          To use EventureAI integration, please add your API keys to Project
          Settings → Secrets.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-[#F8F9FA] dark:bg-[#333333] p-6 rounded-lg">
            <h3 className="font-semibold text-[#0F172A] dark:text-white mb-3">
              Required Secrets
            </h3>
            <ul className="space-y-2 text-sm text-[#667085] dark:text-[#A1A1AA]">
              {[
                "EVENTUREAI_API_KEY",
                "APP_MEMORY_KEY",
                "BUSINESS_MEMORY_KEY",
                "ENTERPRISE_MEMORY_KEY",
                "CRON_SECRET",
              ].map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Key size={14} />
                    <code>{key}</code>
                  </div>
                  {configCheck.data?.data?.present ? (
                    configCheck.data.data.present[key] ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )
                  ) : null}
                </li>
              ))}
            </ul>

            {configCheck.data?.data?.missing?.length > 0 && (
              <div className="mt-4 text-left text-sm">
                <div className="font-medium text-[#0F172A] dark:text-white mb-1">
                  Missing:
                </div>
                <div className="text-[#667085] dark:text-[#A1A1AA]">
                  {configCheck.data.data.missing.join(", ")}
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-[#0F172A] dark:text-white mb-3">
              Setup Steps
            </h3>
            <ol className="space-y-2 text-sm text-[#667085] dark:text-[#A1A1AA]">
              <li className="flex items-start gap-2">
                <span className="font-medium text-blue-600">1.</span>
                Go to Project Settings
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-blue-600">2.</span>
                Click on "Secrets"
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-blue-600">3.</span>
                Add each required secret exactly as listed (names are case
                sensitive)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-blue-600">4.</span>
                Refresh this page
              </li>
            </ol>

            <div className="mt-6">
              <button
                onClick={() => configCheck.refetch()}
                className="flex items-center gap-2 mx-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-150"
              >
                <RefreshCw
                  size={16}
                  className={configCheck.isFetching ? "animate-spin" : ""}
                />
                {configCheck.isFetching ? "Checking..." : "Check Configuration"}
              </button>
              {configCheck.data?.error && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-300">
                  {configCheck.data.error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
