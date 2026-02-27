import { Brain, RefreshCw } from "lucide-react";

export function MemoriesList({ memoriesQuery, selectedMemoryType }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F172A] dark:text-white">
          Memories ({memoriesQuery.data?.count || 0})
        </h3>
        <button
          onClick={() => memoriesQuery.refetch()}
          disabled={memoriesQuery.isRefetching}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <RefreshCw
            size={16}
            className={memoriesQuery.isRefetching ? "animate-spin" : ""}
          />
        </button>
      </div>

      {memoriesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
        </div>
      ) : memoriesQuery.data?.memories?.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {memoriesQuery.data.memories.map((memory, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="text-sm text-[#0F172A] dark:text-white mb-1">
                {memory.content || memory.summary || "Memory content"}
              </div>
              <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                {memory.timestamp || memory.created_at || "Recent"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-[#667085] dark:text-[#A1A1AA]">
            No memories found for {selectedMemoryType} type
          </p>
        </div>
      )}
    </div>
  );
}
