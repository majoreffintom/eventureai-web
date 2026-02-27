import { Copy } from "lucide-react";
import { useCallback } from "react";

export function ResultDisplay({ resultJson }) {
  const onCopy = useCallback(async (value) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
          Last result
        </div>
        <button
          type="button"
          onClick={() => onCopy(resultJson)}
          disabled={!resultJson}
          className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Copy size={16} />
          Copy JSON
        </button>
      </div>

      {!resultJson && (
        <div className="mt-3 text-sm text-[#667085] dark:text-[#A1A1AA]">
          Nothing yet.
        </div>
      )}

      {resultJson && (
        <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
          {resultJson}
        </pre>
      )}
    </div>
  );
}
