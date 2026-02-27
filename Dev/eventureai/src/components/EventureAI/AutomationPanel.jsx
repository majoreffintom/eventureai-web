import { RefreshCw, Shield, Settings, ArrowRight } from "lucide-react";

const cronActions = [
  {
    action: "sync_memories",
    label: "Sync Memories",
    description: "Synchronize latest memories from EventureAI",
    icon: RefreshCw,
  },
  {
    action: "backup_memories",
    label: "Backup Memories",
    description: "Create backup of all memories",
    icon: Shield,
  },
  {
    action: "cleanup_old_memories",
    label: "Cleanup Old Memories",
    description: "Remove old memories to optimize storage",
    icon: Settings,
  },
];

export function AutomationPanel({ testCronMutation, selectedMemoryType }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">
        Automation
      </h3>
      <div className="space-y-3">
        {cronActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.action}
              onClick={() =>
                testCronMutation.mutate({
                  action: action.action,
                  selectedMemoryType,
                })
              }
              disabled={testCronMutation.isPending}
              className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
            >
              <div className="flex items-start gap-3">
                <Icon size={20} className="text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-[#0F172A] dark:text-white text-sm">
                    {action.label}
                  </div>
                  <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                    {action.description}
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
