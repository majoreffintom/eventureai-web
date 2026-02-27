"use client";
import { useState } from "react";

export default function TestMemoryPage() {
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [memoryResult, setMemoryResult] = useState(null);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appsResult, setAppsResult] = useState(null);
  const [isLoadingFinance, setIsLoadingFinance] = useState(false);
  const [financeResult, setFinanceResult] = useState(null);
  const [error, setError] = useState(null);
  const [memoryKeysConfigured, setMemoryKeysConfigured] = useState(false);

  // Configure Memory Keys with the provided values
  const configureMemoryKeys = async () => {
    setIsLoadingMemory(true);
    setError(null);

    const memoryKeys = {
      enterprise:
        "ent_8b1f3c9e2a7d4f6b0c5a2d7e9f1c3b8a6d4e2f7b9c1a5е3f6d8b0c2a4e6f1d3",
      business:
        "bus_4е7a1c9d3b6f2а8e0d5c1f7b9aЗe6d2c4b8a1f5e7d9c3a2b6f0e4d8c2a1f7",
      app: "c1eЗf5a7d9b1c3e5f7a9d1b3c5e7f9a1d3",
    };

    try {
      const response = await fetch("/api/memory/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "configure",
          keys: memoryKeys,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to configure keys: ${response.status}`);
      }

      const data = await response.json();
      setMemoryKeysConfigured(true);
      setMemoryResult({
        memory_keys_configured: true,
        configuration: data,
      });
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoadingMemory(false);
    }
  };

  // Add new function to capture EVENTUREAI vision
  const captureEventureaiVision = async () => {
    setIsLoadingMemory(true);
    setError(null);

    try {
      const response = await fetch("/api/memory/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `EVENTUREAI Vision & Mission: Wyoming corporation designed to empower small businesses and entrepreneurs through integrated full-stack development platform. Core mission is to democratize access to professional-grade business tools by replacing expensive, fragmented services (web developers, hosting, QuickBooks, CPA services, tax software) with one affordable, comprehensive solution. Primary goals: 1) Decentralization of business tools, 2) Empowerment of self-employed individuals, 3) Providing a "fighting chance" through accessible technology, 4) Affordable alternative to traditional professional services.`,
          reasoning_chain:
            "User defining the foundational concept and business model for EVENTUREAI",
          user_intent_analysis:
            "Establishing core business vision - comprehensive small business empowerment platform",
          cross_domain_connections: [
            "small business",
            "entrepreneurship",
            "full-stack development",
            "business automation",
            "decentralization",
            "self-employment",
            "Wyoming corporation",
          ],
          session_context:
            "Initial memory building conversation - capturing EVENTUREAI business concept and mission",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to capture memory: ${response.status}`);
      }

      const data = await response.json();
      setMemoryResult({ eventureai_vision_captured: true, entry: data.entry });
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoadingMemory(false);
    }
  };

  const populateDemo = async () => {
    setIsLoadingMemory(true);
    setError(null);

    try {
      const response = await fetch("/api/demo-auto-capture", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to populate: ${response.status}`);
      }

      const data = await response.json();
      setMemoryResult(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoadingMemory(false);
    }
  };

  const populateAppsDemo = async () => {
    setIsLoadingApps(true);
    setError(null);

    try {
      const response = await fetch("/api/apps/populate-demo", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to populate apps: ${response.status}`);
      }

      const data = await response.json();
      setAppsResult(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const populateFinanceDemo = async () => {
    setIsLoadingFinance(true);
    setError(null);

    try {
      // First ensure apps are created
      await fetch("/api/apps/populate-demo", { method: "POST" });

      // Create demo customers
      const customersResponse = await fetch("/api/finance/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: "Acme Corp",
          contact_name: "John Smith",
          email: "john@acme.com",
          customer_type: "business",
          billing_address: {
            street: "123 Main St",
            city: "San Francisco",
            state: "CA",
            zip: "94105",
          },
        }),
      });

      const customer = await customersResponse.json();

      // Create demo transactions
      const transactions = [
        {
          transaction_type: "revenue",
          amount: 2500,
          description: "EVENTEREAI Monthly Subscription",
          customer_id: customer.customer?.id,
          revenue_category_id: 1,
        },
        {
          transaction_type: "expense",
          amount: 800,
          description: "AWS Cloud Infrastructure",
          expense_category_id: 1,
        },
        {
          transaction_type: "revenue",
          amount: 1200,
          description: "API Usage Fees",
          revenue_category_id: 4,
        },
        {
          transaction_type: "expense",
          amount: 300,
          description: "OpenAI API Costs",
          expense_category_id: 2,
        },
      ];

      const transactionResults = [];
      for (const trans of transactions) {
        const response = await fetch("/api/finance/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trans),
        });
        const result = await response.json();
        transactionResults.push(result);
      }

      setFinanceResult({
        success: true,
        customer: customer.customer,
        transactions: transactionResults.length,
        total_revenue: transactions
          .filter((t) => t.transaction_type === "revenue")
          .reduce((sum, t) => sum + t.amount, 0),
        total_expenses: transactions
          .filter((t) => t.transaction_type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
        message: "Finance demo data populated successfully!",
      });
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoadingFinance(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧠 EVENTEREAI System Test Dashboard
          </h1>

          <div className="space-y-8">
            {/* Memory Keys Configuration - FIRST STEP */}
            <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">
                🔑 Configure Memory Keys (Step 1)
              </h2>
              <p className="text-gray-600 mb-4">
                Configure the three enterprise-level memory keys to enable
                context-aware memory storage
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-xs text-left space-y-1 font-mono">
                  <div>• ENTERPRISE_MEMORY_KEY: ent_8b1f3c9e2a7d4f6b...</div>
                  <div>• BUSINESS_MEMORY_KEY: bus_4е7a1c9d3b6f2а8e...</div>
                  <div>• APP_MEMORY_KEY: c1eЗf5a7d9b1c3e5f7a9...</div>
                </div>
              </div>
              <button
                onClick={configureMemoryKeys}
                disabled={isLoadingMemory || memoryKeysConfigured}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {memoryKeysConfigured
                  ? "✅ Keys Configured"
                  : isLoadingMemory
                    ? "🔄 Configuring..."
                    : "🔑 Configure Memory Keys"}
              </button>
            </div>

            {/* EVENTUREAI Vision Capture */}
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">
                🎯 Capture EVENTUREAI Vision
              </h2>
              <p className="text-gray-600 mb-4">
                Store the core business concept and mission in memory
              </p>
              <button
                onClick={captureEventureaiVision}
                disabled={isLoadingMemory}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
              >
                {isLoadingMemory
                  ? "🔄 Capturing..."
                  : "💾 Capture Vision to Memory"}
              </button>
            </div>

            {/* Memory System Demo */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">
                🧠 Memory System Demo
              </h2>
              <p className="text-gray-600 mb-4">
                Populate with sample memories, categories, and clusters
              </p>
              <button
                onClick={populateDemo}
                disabled={isLoadingMemory}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isLoadingMemory
                  ? "🔄 Populating..."
                  : "🚀 Populate Memory Demo"}
              </button>
            </div>

            {/* Apps System Demo */}
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">
                🏗️ Apps & Secrets Demo
              </h2>
              <p className="text-gray-600 mb-4">
                Create sample apps (internal domains + external APIs) with
                secrets and dependencies
              </p>
              <button
                onClick={populateAppsDemo}
                disabled={isLoadingApps}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                {isLoadingApps
                  ? "🔄 Creating Apps..."
                  : "🔧 Populate Apps Demo"}
              </button>
            </div>

            {/* Financial System Demo */}
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">
                💰 Financial Management Demo
              </h2>
              <p className="text-gray-600 mb-4">
                Create sample customers, transactions, and revenue tracking for
                EVENTEREAI
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={populateFinanceDemo}
                  disabled={isLoadingFinance}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {isLoadingFinance
                    ? "🔄 Creating..."
                    : "💸 Populate Finance Demo"}
                </button>
                <a
                  href="/finance"
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                >
                  📊 View Finance Dashboard
                </a>
              </div>
            </div>

            {/* Memory Results Display */}
            {memoryResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  ✅ Memory System Results!
                </h3>
                <div className="space-y-3 text-sm">
                  {/* Memory Keys Configuration Results */}
                  {memoryResult.memory_keys_configured && (
                    <div className="bg-white p-3 rounded border-l-4 border-red-500">
                      <strong>🔑 Memory Keys Configured:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>
                          • Enterprise Key:{" "}
                          {memoryResult.configuration?.keys_configured
                            ?.enterprise
                            ? "✅"
                            : "❌"}
                        </li>
                        <li>
                          • Business Key:{" "}
                          {memoryResult.configuration?.keys_configured?.business
                            ? "✅"
                            : "❌"}
                        </li>
                        <li>
                          • App Key:{" "}
                          {memoryResult.configuration?.keys_configured?.app
                            ? "✅"
                            : "❌"}
                        </li>
                      </ul>
                      <p className="mt-2 text-green-600 font-medium">
                        {memoryResult.configuration?.message}
                      </p>
                    </div>
                  )}

                  {/* EventureAI Vision Capture Results */}
                  {memoryResult.eventureai_vision_captured && (
                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <strong>🎯 EventureAI Vision Captured:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• Entry ID: {memoryResult.entry?.entry?.id}</li>
                        <li>
                          • Context:{" "}
                          {memoryResult.entry?.memory_context?.context ||
                            "enterprise"}
                        </li>
                        <li>
                          • Priority:{" "}
                          {memoryResult.entry?.memory_context?.priority ||
                            "high"}
                        </li>
                        <li>
                          • Key Assigned:{" "}
                          {memoryResult.entry?.memory_context?.key_assigned
                            ? "✅"
                            : "❌"}
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Demo Population Results */}
                  {memoryResult.demo_populated?.summary && (
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <strong>🧠 Demo Results:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>
                          • Total Entries:{" "}
                          {memoryResult.demo_populated.summary.total_entries ||
                            0}
                        </li>
                        <li>
                          • Avg Confidence:{" "}
                          {memoryResult.demo_populated.summary.avg_confidence?.toFixed(
                            1,
                          ) || 0}
                          /10
                        </li>
                        <li>
                          • New Clusters:{" "}
                          {memoryResult.demo_populated.summary
                            .new_clusters_created || 0}
                        </li>
                      </ul>
                    </div>
                  )}

                  {memoryResult.auto_capture_completed && (
                    <div className="bg-white p-3 rounded">
                      <strong>Auto-Capture Test:</strong>
                      <p className="mt-1">
                        ✅ Current conversation automatically captured
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Apps Results Display */}
            {appsResult && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">
                  ✅ Apps & Secrets Created!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded">
                    <strong>Apps Created:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Total: {appsResult.summary?.total_apps || 0}</li>
                      <li>
                        • Internal: {appsResult.summary?.internal_apps || 0}
                      </li>
                      <li>
                        • External APIs:{" "}
                        {appsResult.summary?.external_apis || 0}
                      </li>
                      <li>
                        • SaaS Tools: {appsResult.summary?.saas_tools || 0}
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <strong>Configuration:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>
                        • Secrets: {appsResult.summary?.total_secrets || 0}
                      </li>
                      <li>
                        • Dependencies:{" "}
                        {appsResult.summary?.total_dependencies || 0}
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 text-xs text-purple-600">
                  <strong>Sample apps:</strong>{" "}
                  {appsResult.results?.apps?.map((a) => a.name).join(", ")}
                </div>
              </div>
            )}

            {/* Financial Results Display */}
            {financeResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  ✅ Financial Data Populated!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded">
                    <strong>Demo Transactions:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>
                        • Total Transactions: {financeResult.transactions || 0}
                      </li>
                      <li>• Revenue: ${financeResult.total_revenue || 0}</li>
                      <li>• Expenses: ${financeResult.total_expenses || 0}</li>
                      <li>
                        • Net Profit: $
                        {(financeResult.total_revenue || 0) -
                          (financeResult.total_expenses || 0)}
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <strong>Customer Created:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>
                        • Name: {financeResult.customer?.business_name || "N/A"}
                      </li>
                      <li>• Email: {financeResult.customer?.email || "N/A"}</li>
                      <li>
                        • Type: {financeResult.customer?.customer_type || "N/A"}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ❌ Error Occurred
                </h3>
                <p className="text-red-700 font-mono text-sm">{error}</p>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <a
                href="/memory"
                className="block bg-purple-100 hover:bg-purple-200 rounded-lg p-4 text-center transition-colors"
              >
                <div className="text-2xl mb-2">🎛️</div>
                <div className="font-medium">Memory Dashboard</div>
                <div className="text-sm text-gray-600">
                  Browse & manage memories
                </div>
              </a>

              <a
                href="/"
                className="block bg-blue-100 hover:bg-blue-200 rounded-lg p-4 text-center transition-colors"
              >
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-medium">AI Chat Interface</div>
                <div className="text-sm text-gray-600">
                  Interact with memory system
                </div>
              </a>

              <a
                href="/finance"
                className="block bg-green-100 hover:bg-green-200 rounded-lg p-4 text-center transition-colors"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium">Finance Dashboard</div>
                <div className="text-sm text-gray-600">
                  Revenue & expense tracking
                </div>
              </a>

              <a
                href="/apps"
                className="block bg-orange-100 hover:bg-orange-200 rounded-lg p-4 text-center transition-colors"
              >
                <div className="text-2xl mb-2">🌐</div>
                <div className="font-medium">Apps & Domains</div>
                <div className="text-sm text-gray-600">
                  Manage your app portfolio
                </div>
              </a>

              <div className="block bg-gray-100 rounded-lg p-4 text-center cursor-pointer">
                <div className="text-2xl mb-2">🏗️</div>
                <div className="font-medium">Secrets & Config</div>
                <div className="text-sm text-gray-600">
                  Manage API keys & settings
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
