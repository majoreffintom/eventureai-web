import { CheckCircle, AlertCircle } from "lucide-react";

export function CronTestResults({ cronTestResult }) {
  if (!cronTestResult) return null;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">
        Test Results
      </h3>
      <div
        className={`p-3 rounded-lg ${
          cronTestResult.success
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {cronTestResult.success ? (
            <CheckCircle size={16} className="text-green-600" />
          ) : (
            <AlertCircle size={16} className="text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              cronTestResult.success
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }`}
          >
            {cronTestResult.success ? "Success" : "Failed"}
          </span>
        </div>
        <div
          className={`text-xs ${
            cronTestResult.success
              ? "text-green-700 dark:text-green-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {cronTestResult.message || cronTestResult.error}
        </div>
      </div>
    </div>
  );
}
