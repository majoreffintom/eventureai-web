import { Copy } from "lucide-react";

export function GeneratedTokenDisplay({ generatedToken, curlSnippet, onCopy }) {
  if (!generatedToken?.token) return null;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
            New token created (copy now)
          </div>
          <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
            Token ID:{" "}
            <span className="font-mono">{generatedToken.tokenId}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCopy(generatedToken.token)}
          className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
        >
          <Copy size={16} />
          Copy token
        </button>
      </div>

      <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
        {generatedToken.token}
      </pre>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
            Curl example (write)
          </div>
          <button
            type="button"
            onClick={() => onCopy(curlSnippet)}
            className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
          >
            <Copy size={16} />
            Copy curl
          </button>
        </div>
        <pre className="mt-3 text-xs bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
          {curlSnippet}
        </pre>
      </div>
    </div>
  );
}
