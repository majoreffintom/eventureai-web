"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe,
  Database,
  Play,
  Eye,
  Brain,
  ExternalLink,
  Download,
  Activity,
} from "lucide-react";

export default function RealTimeDataPage() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [autoCapture, setAutoCapture] = useState(true);
  const [liveData, setLiveData] = useState({});

  // Get all registered apps
  const {
    data: apps,
    isLoading: appsLoading,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ["registered-apps"],
    queryFn: async () => {
      const response = await fetch("/api/apps");
      if (!response.ok) throw new Error("Failed to fetch apps");
      return response.json();
    },
  });

  // Populate real working APIs
  const populateRealAppsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/apps/populate-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to populate real apps");
      return response.json();
    },
    onSuccess: () => {
      refetchApps();
    },
  });

  // Test all apps
  const testAllAppsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/live-data/fetch", {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to test apps");
      return response.json();
    },
  });

  // Fetch live data from specific app
  const fetchLiveDataMutation = useMutation({
    mutationFn: async ({ appId, endpoint }) => {
      const params = new URLSearchParams({
        app_id: appId,
        auto_capture: autoCapture.toString(),
      });
      if (endpoint) params.set("endpoint", endpoint);

      const response = await fetch(`/api/live-data/fetch?${params}`);
      if (!response.ok) throw new Error("Failed to fetch live data");
      return response.json();
    },
    onSuccess: (data, variables) => {
      setLiveData((prev) => ({
        ...prev,
        [variables.appId]: data,
      }));
    },
  });

  const externalApps =
    apps?.apps?.filter((app) => app.app_type === "external_api") || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Activity
                  size={32}
                  className="text-[#0F172A] dark:text-white"
                />
                <div>
                  <h1 className="font-bold text-[28px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                    Real-Time External Data Integration
                  </h1>
                  <p className="text-[14px] text-[#667085] dark:text-[#A1A1AA] font-inter">
                    Live data fetching from external APIs with autonomous AI
                    capture
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {externalApps.length === 0 && (
                <button
                  onClick={() => populateRealAppsMutation.mutate()}
                  disabled={populateRealAppsMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-150"
                >
                  {populateRealAppsMutation.isPending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Add Real APIs
                </button>
              )}

              <button
                onClick={() => testAllAppsMutation.mutate()}
                disabled={testAllAppsMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-150"
              >
                {testAllAppsMutation.isPending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                Test All Apps
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Apps List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
              <div className="p-6 border-b border-[#EAECF0] dark:border-[#404040]">
                <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                  External APIs Ready for Live Data
                </h2>
                <p className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
                  {externalApps.length} real working APIs registered
                </p>
              </div>

              <div className="p-6">
                {appsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw
                      size={24}
                      className="animate-spin text-[#667085]"
                    />
                  </div>
                ) : externalApps.length > 0 ? (
                  <div className="space-y-4">
                    {externalApps.map((app) => (
                      <div
                        key={app.id}
                        className={`p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#F8F9FA] dark:hover:bg-[#333333] ${
                          selectedApp === app.id
                            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                        onClick={() => setSelectedApp(app.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Globe size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-[#0F172A] dark:text-white">
                                {app.name}
                              </h3>
                              <p className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                                {app.domain}
                              </p>
                              <p className="text-xs text-[#667085] dark:text-[#A1A1AA] mt-1">
                                {app.description}
                              </p>

                              {/* Available Endpoints */}
                              {app.metadata?.endpoints && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {app.metadata.endpoints
                                    .slice(0, 3)
                                    .map((endpoint, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                      >
                                        {endpoint}
                                      </span>
                                    ))}
                                </div>
                              )}

                              {/* Live Data Status */}
                              {liveData[app.id] && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle
                                      size={14}
                                      className="text-green-500"
                                    />
                                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                      Live Data Retrieved
                                    </span>
                                  </div>
                                  <div className="text-xs text-green-700 dark:text-green-300">
                                    Status: {liveData[app.id].response.status} •
                                    {liveData[app.id].captured_to_memory
                                      ? " Captured to Memory"
                                      : " Not Captured"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://${app.domain}`, "_blank");
                              }}
                              className="p-2 hover:bg-[#F8F9FA] dark:hover:bg-[#404040] rounded"
                            >
                              <ExternalLink
                                size={14}
                                className="text-[#667085] dark:text-[#A1A1AA]"
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchLiveDataMutation.mutate({
                                  appId: app.id,
                                  endpoint:
                                    customEndpoint ||
                                    app.metadata?.endpoints?.[0] ||
                                    "",
                                });
                              }}
                              disabled={fetchLiveDataMutation.isPending}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                              {fetchLiveDataMutation.isPending &&
                              fetchLiveDataMutation.variables?.appId ===
                                app.id ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Zap size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database
                      size={48}
                      className="text-[#667085] dark:text-[#A1A1AA] mx-auto mb-4"
                    />
                    <p className="text-[#667085] dark:text-[#A1A1AA] mb-4">
                      No external APIs registered yet
                    </p>
                    <button
                      onClick={() => populateRealAppsMutation.mutate()}
                      disabled={populateRealAppsMutation.isPending}
                      className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-150"
                    >
                      {populateRealAppsMutation.isPending ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      Add Real Working APIs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Test Results Panel */}
            {testAllAppsMutation.data && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
                <div className="p-4 border-b border-[#EAECF0] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                    Live Test Results
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="text-lg font-bold text-green-800 dark:text-green-200">
                          {testAllAppsMutation.data.summary.successful}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Working
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="text-lg font-bold text-red-800 dark:text-red-200">
                          {testAllAppsMutation.data.summary.failed}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Failed
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                        {testAllAppsMutation.data.summary.success_rate}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Success Rate
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 max-h-32 overflow-y-auto">
                    {testAllAppsMutation.data.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 text-xs py-1 ${
                          result.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle size={12} />
                        ) : (
                          <AlertCircle size={12} />
                        )}
                        <span>{result.app}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fetch Controls */}
            {selectedApp && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
                <div className="p-4 border-b border-[#EAECF0] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                    Fetch Live Data
                  </h3>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                      Endpoint (optional)
                    </label>
                    <input
                      type="text"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="/users, /posts, etc."
                      className="w-full px-3 py-2 border border-[#D0D5DD] dark:border-[#505050] rounded-lg bg-white dark:bg-[#333333] text-[#0F172A] dark:text-white text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoCapture}
                      onChange={(e) => setAutoCapture(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                      Auto-capture to memory
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      fetchLiveDataMutation.mutate({
                        appId: selectedApp,
                        endpoint: customEndpoint,
                      })
                    }
                    disabled={fetchLiveDataMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0F172A] hover:bg-[#17233A] text-white rounded-lg transition-all duration-150"
                  >
                    {fetchLiveDataMutation.isPending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Zap size={16} />
                    )}
                    Fetch Live Data Now
                  </button>
                </div>
              </div>
            )}

            {/* Live Data Preview */}
            {selectedApp && liveData[selectedApp] && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
                <div className="p-4 border-b border-[#EAECF0] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                    Live Response Data
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                      <span className="font-medium">URL:</span>{" "}
                      {liveData[selectedApp].request.url}
                    </div>
                    <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                      <span className="font-medium">Status:</span>{" "}
                      {liveData[selectedApp].response.status}
                    </div>
                    <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                      <span className="font-medium">Time:</span>{" "}
                      {new Date(
                        liveData[selectedApp].request.timestamp,
                      ).toLocaleTimeString()}
                    </div>
                  </div>

                  <pre className="text-xs text-[#667085] dark:text-[#A1A1AA] bg-[#F8F9FA] dark:bg-[#333333] p-3 rounded-lg overflow-auto max-h-64">
                    {JSON.stringify(
                      liveData[selectedApp].response.data,
                      null,
                      2,
                    )}
                  </pre>

                  {liveData[selectedApp].captured_to_memory && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Brain size={16} />
                      <span>Captured to AI Memory System</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
