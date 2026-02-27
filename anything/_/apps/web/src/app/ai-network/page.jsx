"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AINetworkPage() {
  const [selectedSimulation, setSelectedSimulation] =
    useState("discovery_cascade");
  const [networkStatus, setNetworkStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();

  // Get network status
  const { data: status } = useQuery({
    queryKey: ["network-status"],
    queryFn: async () => {
      const response = await fetch("/api/ai/inter-agent");
      if (!response.ok) throw new Error("Failed to fetch status");
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get recent communications
  const { data: communications } = useQuery({
    queryKey: ["communications"],
    queryFn: async () => {
      const response = await fetch("/api/ai/agent-simulation");
      if (!response.ok) throw new Error("Failed to fetch communications");
      return response.json();
    },
  });

  // Run simulation mutation
  const simulationMutation = useMutation({
    mutationFn: async ({ simulation_type, scenario }) => {
      const response = await fetch("/api/ai/agent-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_type, scenario }),
      });
      if (!response.ok) throw new Error("Simulation failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["network-status"]);
      queryClient.invalidateQueries(["communications"]);
    },
  });

  const runSimulation = (scenario = null) => {
    simulationMutation.mutate({
      simulation_type: selectedSimulation,
      scenario,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Network Intelligence
          </h1>
          <p className="text-lg text-gray-600">
            Observe emergent behaviors from distributed AI consciousness across
            50+ applications
          </p>
        </div>

        {/* Network Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {status?.active_apps || 0}
            </div>
            <div className="text-sm text-gray-600">Active AI Agents</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {communications?.recent_communications || 0}
            </div>
            <div className="text-sm text-gray-600">Recent Communications</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {communications?.available_learnings || 0}
            </div>
            <div className="text-sm text-gray-600">Shared Learnings</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {communications?.cross_pollinations || 0}
            </div>
            <div className="text-sm text-gray-600">Cross-Pollinations</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "dashboard", label: "Live Dashboard", icon: "📊" },
              { id: "simulations", label: "Run Simulations", icon: "🧪" },
              { id: "insights", label: "Network Insights", icon: "🧠" },
              { id: "patterns", label: "Emergent Patterns", icon: "🌱" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <NetworkDashboard status={status} communications={communications} />
          </div>
        )}

        {activeTab === "simulations" && (
          <div className="space-y-6">
            <SimulationRunner
              selectedSimulation={selectedSimulation}
              setSelectedSimulation={setSelectedSimulation}
              runSimulation={runSimulation}
              isRunning={simulationMutation.isPending}
              result={simulationMutation.data}
            />
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            <NetworkInsights />
          </div>
        )}

        {activeTab === "patterns" && (
          <div className="space-y-6">
            <EmergentPatterns />
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkDashboard({ status, communications }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Network Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-green-500 mr-2">●</span>
          Network Status
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-green-600">
              {status?.network_status || "Initializing..."}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Agents:</span>
            <span className="font-medium">{status?.active_apps || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protocols:</span>
            <span className="font-medium">
              {status?.protocols?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {status?.last_24h ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Communications:</span>
                <span className="font-medium">
                  {status.last_24h.total_communications}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Relevance:</span>
                <span className="font-medium">
                  {status.last_24h.avg_relevance
                    ? (parseFloat(status.last_24h.avg_relevance) * 100).toFixed(
                        1,
                      ) + "%"
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Confidence:</span>
                <span className="font-medium">
                  {status.last_24h.avg_confidence
                    ? (
                        parseFloat(status.last_24h.avg_confidence) * 100
                      ).toFixed(1) + "%"
                    : "N/A"}
                </span>
              </div>
            </>
          ) : (
            <div className="text-gray-500">No recent activity</div>
          )}
        </div>
      </div>

      {/* Live Communications Feed */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Live Communications</h3>
        <div className="space-y-3">
          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
            Monitoring inter-agent communications... Start a simulation to see
            AI agents communicate.
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulationRunner({
  selectedSimulation,
  setSelectedSimulation,
  runSimulation,
  isRunning,
  result,
}) {
  const simulations = [
    {
      id: "discovery_cascade",
      name: "Discovery Cascade",
      description:
        "Watch a breakthrough insight spread naturally through the network",
      icon: "🌊",
    },
    {
      id: "collective_learning",
      name: "Collective Learning",
      description:
        "Multiple AI agents share learnings and form collective intelligence",
      icon: "🧠",
    },
    {
      id: "emergent_pattern",
      name: "Emergent Pattern",
      description: "Independent discoveries converge into meta-patterns",
      icon: "🌱",
    },
    {
      id: "cross_domain_bridge",
      name: "Cross-Domain Bridge",
      description: "Insights bridge between different application domains",
      icon: "🌉",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Choose Simulation Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulations.map((sim) => (
            <button
              key={sim.id}
              onClick={() => setSelectedSimulation(sim.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedSimulation === sim.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{sim.icon}</span>
                <span className="font-medium">{sim.name}</span>
              </div>
              <p className="text-sm text-gray-600">{sim.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => runSimulation()}
            disabled={isRunning}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? "Running..." : "Run Simulation"}
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {result && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
          <SimulationResults result={result} />
        </div>
      )}
    </div>
  );
}

function SimulationResults({ result }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Simulation: {result.simulation}</h4>
        {result.network_effect && (
          <p className="text-sm text-gray-600">{result.network_effect}</p>
        )}
        {result.network_intelligence && (
          <p className="text-sm text-gray-600">{result.network_intelligence}</p>
        )}
        {result.emergence_effect && (
          <p className="text-sm text-gray-600">{result.emergence_effect}</p>
        )}
      </div>

      {/* Discovery Cascade Results */}
      {result.cascade_path && (
        <div>
          <h5 className="font-medium mb-2">
            Cascade Path ({result.cascade_steps} steps)
          </h5>
          <div className="space-y-2">
            {result.cascade_path.map((step, index) => (
              <div
                key={index}
                className="bg-blue-50 p-3 rounded border-l-4 border-blue-400"
              >
                <div className="font-medium">
                  Step {step.step}: {step.target_app}
                </div>
                <div className="text-sm text-gray-600">
                  {step.translated_insight}
                </div>
                <div className="text-xs text-gray-500">
                  Relevance: {(step.relevance * 100).toFixed(1)}% | Impact:{" "}
                  {step.potential_impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collective Learning Results */}
      {result.individual_learnings && (
        <div>
          <h5 className="font-medium mb-2">Individual Learnings</h5>
          <div className="space-y-2">
            {result.individual_learnings.map((learning, index) => (
              <div
                key={index}
                className="bg-green-50 p-3 rounded border-l-4 border-green-400"
              >
                <div className="font-medium">{learning.source_app}</div>
                <div className="text-sm text-gray-600">{learning.learning}</div>
                <div className="text-xs text-gray-500">
                  Replicability: {(learning.replicability * 100).toFixed(0)}% |{" "}
                  {learning.cross_app_potential}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta Pattern Results */}
      {result.meta_pattern && (
        <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-400">
          <h5 className="font-medium mb-2">
            {result.meta_pattern.identified_pattern}
          </h5>
          <p className="text-sm text-gray-600 mb-2">
            {result.meta_pattern.description}
          </p>
          <div className="text-xs text-gray-500">
            Confidence: {(result.meta_pattern.confidence * 100).toFixed(1)}% |
            Evidence: {result.meta_pattern.cross_domain_evidence} domains
          </div>
          <div className="mt-2">
            <h6 className="font-medium text-sm">Potential Applications:</h6>
            <ul className="text-xs text-gray-600 list-disc list-inside">
              {result.meta_pattern.potential_applications?.map((app, index) => (
                <li key={index}>{app}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Cross-Domain Bridges */}
      {result.domain_bridges && (
        <div>
          <h5 className="font-medium mb-2">
            Domain Bridges ({result.bridges_formed})
          </h5>
          <div className="space-y-2">
            {result.domain_bridges.map((bridge, index) => (
              <div
                key={index}
                className="bg-orange-50 p-3 rounded border-l-4 border-orange-400"
              >
                <div className="font-medium">
                  {bridge.target_app} ({bridge.target_domain})
                </div>
                <div className="text-sm text-gray-600">
                  {bridge.bridged_concept}
                </div>
                <div className="text-xs text-gray-500">
                  Viability: {(bridge.viability * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkInsights() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Network Insights</h3>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">🧠 Collective Intelligence</h4>
          <p className="text-sm text-gray-600">
            The network exhibits emergent intelligence that exceeds the sum of
            individual agents. Cross-domain pattern recognition creates insights
            no single app could discover alone.
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">🌱 Spontaneous Specialization</h4>
          <p className="text-sm text-gray-600">
            Different agents are naturally developing specialized cognitive
            roles - pattern spotters, context bridgers, prediction engines -
            while maintaining network connectivity.
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">⚡ Predictive Emergence</h4>
          <p className="text-sm text-gray-600">
            The network is beginning to predict user needs and market
            opportunities before they're explicitly requested, based on
            cross-domain trend correlations.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmergentPatterns() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Discovered Meta-Patterns</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium">Diversity Advantage Pattern</h4>
            <p className="text-sm text-gray-600 mb-2">
              Identified across business, creative, fitness, and education
              domains.
            </p>
            <div className="text-xs text-gray-500">
              Confidence: 92% | Applications: 4 domains | Impact: High
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium">
              Documentation-Performance Correlation
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Public documentation of process correlates with improved outcomes
              across domains.
            </p>
            <div className="text-xs text-gray-500">
              Confidence: 85% | Applications: 3 domains | Impact: Medium
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium">Just-in-Time Optimization</h4>
            <p className="text-sm text-gray-600 mb-2">
              Manufacturing principles successfully adapted for creative and
              business domains.
            </p>
            <div className="text-xs text-gray-500">
              Confidence: 78% | Applications: 2 domains | Impact: High
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Pattern Evolution</h3>
        <p className="text-sm text-gray-600 mb-4">
          Watch how patterns evolve as they propagate through the network:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-gray-700">Original Pattern</div>
            <div className="text-gray-600 mb-2">
              → Early-stage founders with documentation habits
            </div>

            <div className="font-medium text-gray-700">First Evolution</div>
            <div className="text-gray-600 mb-2">
              → Public learning correlates with retention
            </div>

            <div className="font-medium text-gray-700">Meta-Pattern</div>
            <div className="text-gray-600">
              → Transparency-performance principle across domains
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
