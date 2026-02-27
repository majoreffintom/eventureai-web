"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Building,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Plus,
} from "lucide-react";

export default function FinanceDashboard() {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("last_30_days");
  const [selectedApp, setSelectedApp] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadFinanceData();
  }, [selectedPeriod, selectedApp]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      // Load overview data
      const overviewParams = new URLSearchParams({
        report_type: "overview",
        period: selectedPeriod,
        ...(selectedApp && { app_id: selectedApp }),
      });

      const overviewRes = await fetch(`/api/finance/reports?${overviewParams}`);
      const overviewData = await overviewRes.json();

      if (overviewData.success) {
        setOverview(overviewData.data);
      }

      // Load recent transactions
      const transactionParams = new URLSearchParams({
        limit: "10",
        ...(selectedApp && { app_id: selectedApp }),
      });

      const transRes = await fetch(
        `/api/finance/transactions?${transactionParams}`,
      );
      const transData = await transRes.json();

      if (transData.success) {
        setTransactions(transData.transactions);
      }

      // Load customers
      const custRes = await fetch("/api/finance/customers");
      const custData = await custRes.json();

      if (custData.success) {
        setCustomers(custData.customers);
      }

      // Load apps
      const appsRes = await fetch("/api/apps");
      const appsData = await appsRes.json();

      if (appsData.success) {
        setApps(appsData.apps);
      }
    } catch (error) {
      console.error("Error loading finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                EVENTEREAI Financial Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Complete accounting and revenue management
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="2024-01">January 2024</option>
                <option value="2024-Q1">Q1 2024</option>
                <option value="2024">2024</option>
              </select>

              {/* App Filter */}
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Apps</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "transactions", label: "Transactions", icon: DollarSign },
              { id: "customers", label: "Customers", icon: Users },
              { id: "reports", label: "Reports", icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "overview" && overview && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(overview.revenue.total)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {overview.revenue.transactions} transactions
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Net Revenue
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(overview.revenue.net)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">After fees</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Expenses
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(overview.expenses.total)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {overview.expenses.transactions} transactions
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Net Profit
                    </p>
                    <p
                      className={`text-3xl font-bold ${overview.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(overview.profit)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(
                        (overview.profit / overview.revenue.total) *
                        100
                      ).toFixed(1)}
                      % margin
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${overview.profit >= 0 ? "bg-green-100" : "bg-red-100"}`}
                  >
                    <BarChart3
                      className={`h-6 w-6 ${overview.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Metrics */}
            {overview.subscriptions.active > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Subscription Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Active Subscriptions
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {overview.subscriptions.active}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Monthly Recurring Revenue
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(overview.subscriptions.mrr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Annual Recurring Revenue
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(overview.subscriptions.arr)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Customer Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {overview.customers.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">New This Month</p>
                      <p className="text-xl font-bold text-blue-600">
                        {overview.customers.new_30d}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                      <Plus size={16} />
                      <span>Add Transaction</span>
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2">
                      <Users size={16} />
                      <span>Add Customer</span>
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2">
                      <Building size={16} />
                      <span>Add App</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-600">
                      Date
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Description
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Customer
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      App
                    </th>
                    <th className="text-right p-4 font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="text-center p-4 font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="p-4 text-gray-900">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.transaction_type === "revenue"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-900">
                        {transaction.description || "N/A"}
                      </td>
                      <td className="p-4 text-gray-600">
                        {transaction.customer_name || "N/A"}
                      </td>
                      <td className="p-4 text-gray-600">
                        {transaction.app_name || "N/A"}
                      </td>
                      <td
                        className={`p-4 text-right font-semibold ${
                          transaction.transaction_type === "revenue"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.transaction_type === "revenue" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-600">
                      Name
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 10).map((customer) => (
                    <tr key={customer.id} className="border-b">
                      <td className="p-4 text-gray-900">
                        {customer.business_name ||
                          customer.contact_name ||
                          "N/A"}
                      </td>
                      <td className="p-4 text-gray-600">{customer.email}</td>
                      <td className="p-4 text-gray-600">
                        {customer.customer_type}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDate(customer.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Financial Reports
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "Profit & Loss",
                    description: "Revenue and expenses breakdown",
                    type: "profit_loss",
                  },
                  {
                    name: "Cash Flow",
                    description: "Daily cash flow analysis",
                    type: "cash_flow",
                  },
                  {
                    name: "App Performance",
                    description: "Revenue by application",
                    type: "app_performance",
                  },
                ].map((report) => (
                  <div
                    key={report.type}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description}
                    </p>
                    <button className="mt-3 text-blue-600 text-sm font-medium">
                      Generate Report →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
