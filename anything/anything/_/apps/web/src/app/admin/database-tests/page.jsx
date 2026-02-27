"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  AlertCircle,
} from "lucide-react";

export default function DatabaseTestsPage() {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch("/api/db/self-test");
      if (!response.ok) {
        throw new Error(
          `Test failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      console.error("Error running tests:", err);
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = testResults?.results?.filter((r) => r.passed).length || 0;
  const totalCount = testResults?.results?.length || 0;
  const failedCount = totalCount - passedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Simple Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-slate-900">
            Goldey Admin - Database Tests
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Database Tests
          </h2>
          <p className="text-slate-600">
            Comprehensive test suite for database integrity, constraints, and
            workflows
          </p>
        </div>

        {/* Run Tests Button */}
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run All Tests
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Test Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        {testResults && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="text-sm font-medium text-slate-600 mb-1">
                Total Tests
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {totalCount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
              <div className="text-sm font-medium text-green-600 mb-1">
                Passed
              </div>
              <div className="text-3xl font-bold text-green-600">
                {passedCount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="text-sm font-medium text-red-600 mb-1">
                Failed
              </div>
              <div className="text-3xl font-bold text-red-600">
                {failedCount}
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">
                Test Results
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {testResults.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-6 ${result.passed ? "bg-white" : "bg-red-50"}`}
                >
                  <div className="flex items-start gap-4">
                    {result.passed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {result.name}
                      </h3>

                      {/* Individual test results */}
                      {result.results && result.results.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {result.results.map((subTest, subIndex) => (
                            <div
                              key={subIndex}
                              className={`pl-4 border-l-2 ${
                                subTest.passed
                                  ? "border-green-300"
                                  : "border-red-300"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {subTest.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-slate-700">
                                    {subTest.test}
                                  </div>
                                  {subTest.details && (
                                    <div className="text-sm text-slate-600 mt-1">
                                      {subTest.details}
                                    </div>
                                  )}
                                  {subTest.error && (
                                    <div className="text-sm text-red-600 mt-1 font-mono bg-red-50 p-2 rounded">
                                      {subTest.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error message for failed tests */}
                      {!result.passed && result.error && (
                        <div className="mt-2 text-sm text-red-700 font-mono bg-red-100 p-3 rounded">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!testResults && !isRunning && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Ready to Test
              </h3>
              <p className="text-slate-600 mb-6">
                Click the "Run All Tests" button above to execute the
                comprehensive database test suite.
              </p>
              <div className="text-sm text-slate-500">
                Tests include: constraints, workflows, GL posting,
                reconciliation, and more.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
