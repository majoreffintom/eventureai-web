export function AppOverview({ selectedApp }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      {selectedApp.description && (
        <p className="text-[#667085] dark:text-[#A1A1AA] mb-6">
          {selectedApp.description}
        </p>
      )}

      {/* App Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-[#F8F9FA] dark:bg-[#333333] rounded-lg">
          <div className="text-xs text-[#667085] dark:text-[#A1A1AA] mb-1">
            Type
          </div>
          <div className="font-medium text-[#0F172A] dark:text-white capitalize">
            {selectedApp.app_type.replace("_", " ")}
          </div>
        </div>
        <div className="p-3 bg-[#F8F9FA] dark:bg-[#333333] rounded-lg">
          <div className="text-xs text-[#667085] dark:text-[#A1A1AA] mb-1">
            Environment
          </div>
          <div className="font-medium text-[#0F172A] dark:text-white capitalize">
            {selectedApp.environment}
          </div>
        </div>
        <div className="p-3 bg-[#F8F9FA] dark:bg-[#333333] rounded-lg">
          <div className="text-xs text-[#667085] dark:text-[#A1A1AA] mb-1">
            Created
          </div>
          <div className="font-medium text-[#0F172A] dark:text-white">
            {new Date(selectedApp.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="p-3 bg-[#F8F9FA] dark:bg-[#333333] rounded-lg">
          <div className="text-xs text-[#667085] dark:text-[#A1A1AA] mb-1">
            Updated
          </div>
          <div className="font-medium text-[#0F172A] dark:text-white">
            {new Date(selectedApp.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
