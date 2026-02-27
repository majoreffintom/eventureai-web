import { Globe } from "lucide-react";

export function EmptyState() {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-8 text-center">
      <Globe
        size={48}
        className="text-[#667085] dark:text-[#A1A1AA] mx-auto mb-4"
      />
      <h3 className="font-inter font-medium text-lg text-[#0F172A] dark:text-white mb-2">
        Select an App
      </h3>
      <p className="text-[#667085] dark:text-[#A1A1AA] max-w-sm mx-auto">
        Choose an app from the list to view its details, financial performance,
        and management options.
      </p>
    </div>
  );
}
