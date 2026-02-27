import { CheckCircle } from "lucide-react";
import { memoryTypes } from "./MemoryTypeSelector";

export function StatusPanel({ selectedMemoryType }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">
        Integration Status
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            API Connection
          </span>
          <CheckCircle size={16} className="text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            Memory Keys
          </span>
          <CheckCircle size={16} className="text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            Cron Secret
          </span>
          <CheckCircle size={16} className="text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            Current Type
          </span>
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            {memoryTypes.find((t) => t.value === selectedMemoryType)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
