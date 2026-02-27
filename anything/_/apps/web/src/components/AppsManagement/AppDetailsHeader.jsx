import {
  Globe,
  Server,
  Zap,
  Package,
  ExternalLink,
  Key,
  MessageSquare,
} from "lucide-react";

export function AppDetailsHeader({ selectedApp, activeTab, onTabChange }) {
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {getAppIcon(selectedApp.app_type)}
          <div>
            <h2 className="font-inter font-semibold text-xl text-[#0F172A] dark:text-white">
              {selectedApp.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[#667085] dark:text-[#A1A1AA]">
                {selectedApp.domain}
              </span>
              {selectedApp.domain && (
                <a
                  href={`https://${selectedApp.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F172A] dark:text-[#4C9BFF] hover:underline"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge(selectedApp.status)}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-[#0F172A] text-[#0F172A] dark:border-white dark:text-white"
                : "border-transparent text-[#667085] hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => onTabChange("memoria")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "memoria"
                ? "border-[#0F172A] text-[#0F172A] dark:border-white dark:text-white"
                : "border-transparent text-[#667085] hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            <MessageSquare size={14} />
            Memoria
          </button>

          <button
            onClick={() => onTabChange("secrets")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "secrets"
                ? "border-[#0F172A] text-[#0F172A] dark:border-white dark:text-white"
                : "border-transparent text-[#667085] hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            <Key size={14} />
            Secrets
          </button>
        </nav>
      </div>
    </div>
  );
}
