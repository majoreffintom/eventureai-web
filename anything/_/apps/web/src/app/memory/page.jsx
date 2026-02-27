"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Brain,
  Database,
  Layers,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  Bot,
  Filter,
  Zap,
  Mail,
} from "lucide-react";

export default function MemoryIndexPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [pressedButton, setPressedButton] = useState(null);

  const queryClient = useQueryClient();

  // Fetch index categories
  const { data: categoriesData } = useQuery({
    queryKey: ["memory-categories"],
    queryFn: async () => {
      const response = await fetch("/api/memory/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch clusters for selected category
  const { data: clustersData } = useQuery({
    queryKey: ["memory-clusters", selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory) return null;
      const response = await fetch(
        `/api/memory/clusters?category_id=${selectedCategory.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch clusters");
      return response.json();
    },
    enabled: !!selectedCategory,
  });

  // Fetch memory entries for selected cluster
  const { data: entriesData } = useQuery({
    queryKey: ["memory-entries", selectedCluster?.id],
    queryFn: async () => {
      if (!selectedCluster) return null;
      const response = await fetch(
        `/api/memory/entries?cluster_id=${selectedCluster.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch entries");
      return response.json();
    },
    enabled: !!selectedCluster,
  });

  // AI Search mutation
  const aiSearchMutation = useMutation({
    mutationFn: async (query) => {
      const response = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          intent_context: `Current view: ${activeTab}, selected: ${selectedCategory?.name || "none"}`,
        }),
      });
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
  });

  // Demo data population mutation
  const populateDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/memory/populate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to populate demo data");
      return response.json();
    },
    onSuccess: () => {
      // Refresh all data after populating
      queryClient.invalidateQueries({ queryKey: ["memory-categories"] });
      queryClient.invalidateQueries({ queryKey: ["memory-clusters"] });
      queryClient.invalidateQueries({ queryKey: ["memory-entries"] });
    },
  });

  const handleCategoryToggle = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category.id)) {
      newExpanded.delete(category.id);
      if (selectedCategory?.id === category.id) {
        setSelectedCategory(null);
        setSelectedCluster(null);
      }
    } else {
      newExpanded.add(category.id);
      setSelectedCategory(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAiSearch = () => {
    if (!aiQuery.trim()) return;
    aiSearchMutation.mutate(aiQuery);
  };

  const categories = categoriesData?.categories || [];
  const clusters = clustersData?.clusters || [];
  const entries = entriesData?.entries || [];
  const searchResults = aiSearchMutation.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Brain size={32} className="text-[#0F172A] dark:text-white" />
                <h1 className="font-bold text-[32px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                  AI Memory Index
                </h1>
                <span className="inline-flex items-center px-[10px] py-[6px] rounded-full border bg-[#0F172A] dark:bg-[#3B4251] border-[#0F172A] dark:border-[#3B4251] text-white text-[11px] font-semibold tracking-[0.4em] font-inter">
                  NEURAL
                </span>
              </div>
              <p className="text-[16px] leading-[1.2] text-[#667085] dark:text-[#A1A1AA] font-inter max-w-[600px]">
                Intelligent memory organization using intent-based
                categorization and semantic clustering. Navigate through
                reasoning chains and conceptual relationships.
              </p>
            </div>

            {/* Demo data button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href="/resend"
                className="inline-flex items-center justify-center gap-2 h-[40px] px-5 rounded-full border border-[#D0D5DD] dark:border-[#404040] bg-white dark:bg-[#1E1E1E] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626]"
              >
                <Mail size={16} />
                Resend email test
              </a>

              <button
                onClick={() => populateDemoMutation.mutate()}
                disabled={populateDemoMutation.isPending}
                onMouseDown={() => setPressedButton("demo")}
                onMouseUp={() => setPressedButton(null)}
                onMouseLeave={() => setPressedButton(null)}
                className={`
                  flex items-center gap-2 h-[40px] px-6 rounded-full transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 text-sm font-semibold font-inter
                  ${
                    populateDemoMutation.isPending
                      ? "bg-[#F2F4F7] dark:bg-[#333333] text-[#667085] dark:text-[#A1A1AA] cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  }
                  ${pressedButton === "demo" ? "transform scale-95" : ""}
                `}
              >
                <Zap size={16} />
                {populateDemoMutation.isPending
                  ? "Populating..."
                  : "Load Demo Data"}
              </button>
            </div>
          </div>

          {/* Show demo success message */}
          {populateDemoMutation.isSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✨ Demo data loaded successfully!
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                {populateDemoMutation.data?.summary?.total_entries} memory
                entries created with{" "}
                {populateDemoMutation.data?.summary?.new_clusters_created} new
                clusters
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Three-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-300px)]">
          {/* Left Panel - Index Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
                  Index Categories
                </h2>
                <button
                  onMouseDown={() => setPressedButton("add-category")}
                  onMouseUp={() => setPressedButton(null)}
                  onMouseLeave={() => setPressedButton(null)}
                  className={`
                    p-2 rounded-lg transition-all duration-150 ease-out
                    hover:bg-[#F8F9FA] dark:hover:bg-[#262626]
                    focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:focus:ring-[#4C9BFF] focus:ring-offset-2
                    ${pressedButton === "add-category" ? "transform scale-95 bg-[#F1F3F5] dark:bg-[#333333]" : ""}
                  `}
                >
                  <Plus
                    size={16}
                    className="text-[#667085] dark:text-[#A1A1AA]"
                  />
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const isSelected = selectedCategory?.id === category.id;

                  return (
                    <div key={category.id}>
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg transition-all duration-150
                          text-left focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:focus:ring-[#4C9BFF] focus:ring-offset-2
                          ${
                            isSelected
                              ? "bg-[#F9FAFB] dark:bg-[#262626] border border-[#DDE3EA] dark:border-[#404040]"
                              : "hover:bg-[#F6F8FA] dark:hover:bg-[#2A2A2A]"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown
                                size={16}
                                className="text-[#667085] dark:text-[#A1A1AA]"
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                                className="text-[#667085] dark:text-[#A1A1AA]"
                              />
                            )}
                            <Database
                              size={16}
                              className="text-[#667085] dark:text-[#A1A1AA]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-[#0F172A] dark:text-white truncate">
                              {category.name}
                            </div>
                            <div className="text-xs text-[#667085] dark:text-[#A1A1AA] truncate">
                              {category.intent_type} •{" "}
                              {category.complexity_level}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-[#667085] dark:text-[#A1A1AA] bg-[#F2F4F7] dark:bg-[#333333] px-2 py-1 rounded-full">
                          {category.cluster_count}
                        </span>
                      </button>

                      {/* Sub-clusters */}
                      {isExpanded && clusters.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1">
                          {clusters.map((cluster) => (
                            <button
                              key={cluster.id}
                              onClick={() => setSelectedCluster(cluster)}
                              className={`
                                w-full flex items-center gap-3 p-2 rounded-md transition-all duration-150
                                text-left focus:outline-none focus:ring-1 focus:ring-[#0F172A] dark:focus:ring-[#4C9BFF]
                                ${
                                  selectedCluster?.id === cluster.id
                                    ? "bg-[#F2F4F7] dark:bg-[#333333]"
                                    : "hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A]"
                                }
                              `}
                            >
                              <Layers
                                size={14}
                                className="text-[#667085] dark:text-[#A1A1AA]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-[#0F172A] dark:text-white truncate">
                                  {cluster.cluster_name}
                                </div>
                                <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                                  {cluster.memory_count} entries
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel - Data Visualization */}
          <div className="lg:col-span-6 space-y-4">
            {selectedCluster ? (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
                      {selectedCluster.cluster_name}
                    </h2>
                    <p className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                      {selectedCluster.relationship_type} • Confidence:{" "}
                      {selectedCluster.confidence_level}/10
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedCluster.semantic_keywords?.map(
                      (keyword, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-[#F2F4F7] dark:bg-[#333333] text-[#667085] dark:text-[#A1A1AA] rounded-full"
                        >
                          {keyword}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 border border-[#F2F4F7] dark:border-[#404040] rounded-lg hover:bg-[#FAFBFC] dark:hover:bg-[#2A2A2A] transition-all duration-150"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                          Accessed:{" "}
                          {new Date(entry.accessed_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                          Used {entry.usage_frequency}x
                        </span>
                      </div>
                      <p className="text-sm text-[#0F172A] dark:text-white leading-relaxed">
                        {entry.content.slice(0, 300)}
                        {entry.content.length > 300 && "..."}
                      </p>
                      {entry.user_intent_analysis && (
                        <div className="mt-3 p-2 bg-[#F8F9FA] dark:bg-[#333333] rounded-md">
                          <p className="text-xs font-medium text-[#667085] dark:text-[#A1A1AA] mb-1">
                            Intent Analysis:
                          </p>
                          <p className="text-xs text-[#0F172A] dark:text-white">
                            {entry.user_intent_analysis}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-8 text-center">
                <Database
                  size={48}
                  className="text-[#667085] dark:text-[#A1A1AA] mx-auto mb-4"
                />
                <h3 className="font-inter font-medium text-lg text-[#0F172A] dark:text-white mb-2">
                  Select a Category to Explore
                </h3>
                <p className="text-[#667085] dark:text-[#A1A1AA] max-w-sm mx-auto">
                  Choose an index category from the left panel to view its
                  conceptual clusters and memory entries.
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - AI Query Interface */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bot size={20} className="text-[#0F172A] dark:text-white" />
                <h2 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
                  Memory Search
                </h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-3 text-[#667085] dark:text-[#A1A1AA]"
                  />
                  <textarea
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask about anything you remember discussing..."
                    className="w-full pl-10 pr-4 py-3 border border-[#E4E7EC] dark:border-[#404040] rounded-lg bg-white dark:bg-[#262626] text-[#0F172A] dark:text-white placeholder-[#667085] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:focus:ring-[#4C9BFF] focus:ring-offset-2 resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAiSearch();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleAiSearch}
                  disabled={aiSearchMutation.isPending || !aiQuery.trim()}
                  onMouseDown={() => setPressedButton("search")}
                  onMouseUp={() => setPressedButton(null)}
                  onMouseLeave={() => setPressedButton(null)}
                  className={`
                    w-full h-[40px] px-4 rounded-full transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 text-sm font-semibold font-inter
                    ${
                      aiQuery.trim() && !aiSearchMutation.isPending
                        ? "bg-[#0F172A] hover:bg-[#17233A] text-white"
                        : "bg-[#F2F4F7] dark:bg-[#333333] text-[#667085] dark:text-[#A1A1AA] cursor-not-allowed"
                    }
                    ${pressedButton === "search" ? "transform scale-95" : ""}
                  `}
                >
                  {aiSearchMutation.isPending
                    ? "Searching..."
                    : "Search Memory"}
                </button>

                {/* Search Results */}
                {searchResults && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-[#0F172A] dark:text-white">
                        Search Results
                      </h3>
                      <span className="text-xs px-2 py-1 bg-[#F2F4F7] dark:bg-[#333333] text-[#667085] dark:text-[#A1A1AA] rounded-full">
                        {searchResults.results?.length || 0} found
                      </span>
                    </div>

                    {searchResults.navigation_summary && (
                      <div className="text-xs text-[#667085] dark:text-[#A1A1AA] bg-[#F8F9FA] dark:bg-[#333333] p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span>Categories searched:</span>
                          <span>
                            {
                              searchResults.navigation_summary
                                .categories_searched
                            }
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Clusters searched:</span>
                          <span>
                            {searchResults.navigation_summary.clusters_searched}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span>
                            {searchResults.navigation_summary.confidence}/10
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.results?.map((result) => (
                        <div
                          key={result.id}
                          className="p-3 border border-[#F2F4F7] dark:border-[#404040] rounded-lg cursor-pointer hover:bg-[#FAFBFC] dark:hover:bg-[#2A2A2A] transition-all duration-150"
                          onClick={() => {
                            // Navigate to this result's cluster
                            const category = categories.find(
                              (c) => c.name === result.category_name,
                            );
                            if (category) {
                              setSelectedCategory(category);
                              setExpandedCategories(new Set([category.id]));
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[#0F172A] dark:text-white">
                              {result.category_name}
                            </span>
                            <span className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                              {result.cluster_name}
                            </span>
                          </div>
                          <p className="text-xs text-[#667085] dark:text-[#A1A1AA] leading-relaxed">
                            {result.content.slice(0, 120)}...
                          </p>
                        </div>
                      ))}
                    </div>

                    {searchResults.related_concepts?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[#0F172A] dark:text-white mb-2">
                          Related Concepts
                        </h4>
                        <div className="space-y-2">
                          {searchResults.related_concepts.map((concept) => (
                            <div
                              key={concept.id}
                              className="text-xs p-2 bg-[#F8F9FA] dark:bg-[#333333] rounded-md"
                            >
                              <span className="font-medium text-[#0F172A] dark:text-white">
                                {concept.connection_type}:
                              </span>
                              <span className="text-[#667085] dark:text-[#A1A1AA] ml-1">
                                {concept.cluster_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
