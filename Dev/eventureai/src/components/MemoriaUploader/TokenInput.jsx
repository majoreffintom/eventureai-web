import { Shield } from "lucide-react";

export function TokenInput({ token, setToken }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="p-4 rounded-xl border bg-gray-50 border-black/10">
        <div className="flex items-start gap-3">
          <Shield size={18} className="mt-0.5 text-[#0F172A]" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#0F172A]">
              Token required
            </div>
            <div className="mt-1 text-sm text-[#334155]">
              This page never stores your token. Paste it when needed.
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Bearer token
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="memoria.<tokenId>.<secret>"
            type="password"
            className="w-full h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono"
          />
          <div className="mt-1 text-xs text-[#667085] dark:text-[#A1A1AA]">
            Tip: if you see HTTP 429, slow down or ask the admin to raise the
            per-token rate limit.
          </div>
        </div>
      </div>
    </div>
  );
}
