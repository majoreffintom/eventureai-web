"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Globe,
  Database,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Brain,
  ExternalLink,
} from "lucide-react";

export default function LiveIntegrationPage() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch all business applications with live data
  const {
    data: appsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["app-integrations"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/app-data?all=true");
      if (!response.ok) throw new Error("Failed to fetch app data");
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  // Test AI integration with app data
  const aiTestMutation = useMutation({
    mutationFn: async (prompt) => {
      const response = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: {
            conversation_history: [],
            system_status: {
              health: "optimal",
              pending_items: 0,
              suggested_focus: "business_app_integration",
            },
          },
        }),
      });
      if (!response.ok) throw new Error("AI conversation failed");
      return response.json();
    },
  });

  // Capture specific app data to memory
  const captureToMemoryMutation = useMutation({
    mutationFn: async (appId) => {
      const response = await fetch("/api/integrations/app-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          data_type: "full",
          auto_capture: true,
        }),
      });
      if (!response.ok) throw new Error("Failed to capture data");
      return response.json();
    },
  });

  const testPrompts = [
    "Tell me about my business applications",
    "What's the status of Rosebud Veneer?",
    "How is Ditzl performing?",
    "Show me a summary of all my apps",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Database
                  size={32}
                  className="text-[#0F172A] dark:text-white"
                />
                <div>
                  <h1 className="font-bold text-[28px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                    Live Business App Integration
                  </h1>
                  <p className="text-[14px] text-[#667085] dark:text-[#A1A1AA] font-inter">
                    Real-time data integration with AI-powered insights
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                  Auto-refresh
                </span>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#17233A] text-white rounded-lg transition-all duration-150"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
              <div className="p-6 border-b border-[#EAECF0] dark:border-[#404040]">
                <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                  Connected Applications
                </h2>
                <p className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
                  {appsData?.apps?.length || 0} apps with live data integration
                </p>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw
                      size={24}
                      className="animate-spin text-[#667085]"
                    />
                  </div>
                ) : appsData?.apps?.length > 0 ? (
                  <div className="space-y-4">
                    {appsData.apps.map((app, index) => (
                      <div
                        key={index}
                        className={`p-4 border border-[#E4E7EC] dark:border-[#404040] rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#F8F9FA] dark:hover:bg-[#333333] ${
                          selectedApp === index
                            ? "ring-2 ring-[#0F172A] dark:ring-[#4C9BFF]"
                            : ""
                        }`}
                        onClick={() => setSelectedApp(index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Globe size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-[#0F172A] dark:text-white">
                                {app.app}
                              </h3>
                              <p className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                                {app.domain}
                              </p>
                              <p className="text-xs text-[#667085] dark:text-[#A1A1AA] mt-1">
                                {app.description}
                              </p>

                              {/* Live Data Preview */}
                              {app.data && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle
                                      size={14}
                                      className="text-green-500"
                                    />
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                      {app.data.extraction_method} extraction
                                    </span>
                                  </div>

                                  {app.data.page_title && (
                                    <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                                      <span className="font-medium">
                                        Title:
                                      </span>{" "}
                                      {app.data.page_title.trim()}
                                    </div>
                                  )}

                                  {app.data.react_data && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded">
                                        React App
                                      </span>
                                      {app.data.react_data
                                        .estimated_bundle_size && (
                                        <span className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                                          ~
                                          {
                                            app.data.react_data
                                              .estimated_bundle_size
                                          }
                                          KB
                                        </span>
                                      )}
                                    </div>
                                  )}
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
                          </div>
                        </div>

                        {app.error && (
                          <div className="mt-3 flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {app.error}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database
                      size={48}
                      className="text-[#667085] dark:text-[#A1A1AA] mx-auto mb-4"
                    />
                    <p className="text-[#667085] dark:text-[#A1A1AA]">
                      No applications found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Integration Panel */}
          <div className="space-y-6">
            {/* AI Test Panel */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
              <div className="p-4 border-b border-[#EAECF0] dark:border-[#404040]">
                <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                  AI Integration Test
                </h3>
                <p className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
                  Test AI awareness of live app data
                </p>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {testPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => aiTestMutation.mutate(prompt)}
                      disabled={aiTestMutation.isPending}
                      className="w-full p-3 text-left text-sm bg-[#F8F9FA] dark:bg-[#333333] hover:bg-[#F2F4F7] dark:hover:bg-[#404040] border border-[#E4E7EC] dark:border-[#505050] rounded-lg transition-all duration-150"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} />
                        <span>{prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {aiTestMutation.isPending && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        size={14}
                        className="animate-spin text-blue-600"
                      />
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        AI is processing...
                      </span>
                    </div>
                  </div>
                )}

                {aiTestMutation.data && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-sm text-green-800 dark:text-green-200">
                      <div className="font-medium mb-2">AI Response:</div>
                      <div className="text-xs">
                        {aiTestMutation.data.response.slice(0, 200)}...
                      </div>
                      {aiTestMutation.data.suggested_actions?.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">
                            Suggested Actions:{" "}
                            {aiTestMutation.data.suggested_actions.length}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#E4E7EC] dark:border-[#404040]">
                  <a
                    href="/ai-conversation"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#0F172A] hover:bg-[#17233A] text-white rounded-lg transition-all duration-150"
                  >
                    <Brain size={16} />
                    Full AI Interface
                  </a>
                </div>
              </div>
            </div>

            {/* Memory Capture */}
            {selectedApp !== null && appsData?.apps?.[selectedApp] && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
                <div className="p-4 border-b border-[#EAECF0] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                    Memory Integration
                  </h3>
                  <p className="text-sm text-[#667085] dark:text-[#A1A1AA] mt-1">
                    Capture app data to AI memory
                  </p>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="text-sm text-[#0F172A] dark:text-white">
                      <span className="font-medium">Selected:</span>{" "}
                      {appsData.apps[selectedApp].app}
                    </div>

                    <button
                      onClick={() => {
                        // Note: We'd need app_id from the database for this to work
                        // For now, this demonstrates the concept
                        console.log("Capturing app data to memory...");
                        aiTestMutation.mutate(
                          `Capture the current status and data from ${appsData.apps[selectedApp].app} to memory`,
                        );
                      }}
                      disabled={captureToMemoryMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-150"
                    >
                      {captureToMemoryMutation.isPending ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Brain size={16} />
                      )}
                      Capture to Memory
                    </button>

                    <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                      This will store the app's current state and data in the AI
                      memory system for future reference.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Data Preview */}
            {selectedApp !== null && appsData?.apps?.[selectedApp]?.data && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040]">
                <div className="p-4 border-b border-[#EAECF0] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                    Live Data Preview
                  </h3>
                </div>

                <div className="p-4">
                  <pre className="text-xs text-[#667085] dark:text-[#A1A1AA] bg-[#F8F9FA] dark:bg-[#333333] p-3 rounded-lg overflow-auto max-h-64">
                    {JSON.stringify(appsData.apps[selectedApp].data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
