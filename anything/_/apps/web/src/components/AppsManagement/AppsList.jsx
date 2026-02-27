import { Globe, Server, Zap, Package } from "lucide-react";

export function AppsList({ apps, isLoading, selectedApp, onSelectApp }) {
  const getAppIcon = (appType) => {
    switch (appType) {
      case "internal":
        return <Globe size={20} className="text-blue-600" />;
      case "external_api":
        return <Server size={20} className="text-green-600" />;
      case "saas_tool":
        return <Zap size={20} className="text-purple-600" />;
      default:
        return <Package size={20} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      deprecated: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.inactive}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h2 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white mb-6">
        Your Apps ({apps.length})
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 rounded-lg animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApp(app)}
              className={`p-4 border rounded-lg transition-all duration-150 cursor-pointer hover:shadow-md ${
                selectedApp?.id === app.id
                  ? "border-[#0F172A] dark:border-[#4C9BFF] bg-[#F9FAFB] dark:bg-[#262626]"
                  : "border-[#E4E7EC] dark:border-[#404040] hover:border-[#D0D5DD] dark:hover:border-[#525252]"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {getAppIcon(app.app_type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#0F172A] dark:text-white truncate">
                    {app.name}
                  </h3>
                  <p className="text-sm text-[#667085] dark:text-[#A1A1AA] truncate">
                    {app.domain}
                  </p>
                </div>
                {getStatusBadge(app.status)}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085] dark:text-[#A1A1AA] capitalize">
                  {app.app_type.replace("_", " ")}
                </span>
                <span className="text-[#667085] dark:text-[#A1A1AA]">
                  {app.environment}
                </span>
              </div>

              {app.description && (
                <p className="text-xs text-[#667085] dark:text-[#A1A1AA] mt-2 line-clamp-2">
                  {app.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
