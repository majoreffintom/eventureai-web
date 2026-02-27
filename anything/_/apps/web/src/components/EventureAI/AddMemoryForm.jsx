import { Plus, RefreshCw } from "lucide-react";
import { memoryTypes } from "./MemoryTypeSelector";

export function AddMemoryForm({
  newMemory,
  setNewMemory,
  selectedMemoryType,
  addMemoryMutation,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">
        Add Memory
      </h3>
      <div className="space-y-4">
        <textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Enter memory content..."
          rows={4}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-[#333333] text-[#0F172A] dark:text-white"
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
            Type:{" "}
            {memoryTypes.find((t) => t.value === selectedMemoryType)?.label}
          </span>
          <button
            onClick={() =>
              addMemoryMutation.mutate({
                memory: newMemory,
                type: selectedMemoryType,
              })
            }
            disabled={!newMemory.trim() || addMemoryMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-150"
          >
            {addMemoryMutation.isPending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add Memory
          </button>
        </div>
      </div>
    </div>
  );
}
