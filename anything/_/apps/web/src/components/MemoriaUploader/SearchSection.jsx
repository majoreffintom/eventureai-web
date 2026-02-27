import { Search } from "lucide-react";

export function SearchSection({
  searchQ,
  setSearchQ,
  tokenReady,
  busy,
  onSearch,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center">
          <Search size={18} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Search (scoped)
          </div>
          <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            This searches only the token's own app_source.
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row gap-3">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search for a keyword"
          className="flex-1 h-[44px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={!tokenReady || !searchQ.trim() || busy}
          className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60"
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
    </div>
  );
}
