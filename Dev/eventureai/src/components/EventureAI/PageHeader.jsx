import { Brain, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export function PageHeader({ configCheck }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Brain size={32} className="text-purple-600" />
              <div>
                <h1 className="font-bold text-[28px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                  EventureAI Integration
                </h1>
                <p className="text-[14px] text-[#667085] dark:text-[#A1A1AA] font-inter">
                  Advanced AI memory management and automation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {configCheck.isLoading ? (
              <RefreshCw size={16} className="animate-spin text-gray-400" />
            ) : configCheck.data?.configured ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
                <CheckCircle size={16} />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">Not Configured</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
