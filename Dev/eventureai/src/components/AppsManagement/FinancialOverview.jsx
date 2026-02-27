import { TrendingUp, DollarSign } from "lucide-react";

export function FinancialOverview({ selectedApp, appDetails }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-green-600" />
          <h3 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
            Revenue Tracking
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#667085] dark:text-[#A1A1AA]">
              Total Revenue
            </span>
            <span className="font-semibold text-[#0F172A] dark:text-white">
              ${appDetails?.revenue?.total || "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#667085] dark:text-[#A1A1AA]">
              This Month
            </span>
            <span className="font-semibold text-green-600">
              ${appDetails?.revenue?.monthly || "0.00"}
            </span>
          </div>
          <div className="pt-2">
            <a
              href={`/finance?app_id=${selectedApp.id}&tab=transactions`}
              className="text-sm text-[#0F172A] dark:text-[#4C9BFF] hover:underline"
            >
              View transactions →
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign size={20} className="text-red-600" />
          <h3 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
            Expense Tracking
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#667085] dark:text-[#A1A1AA]">
              Total Expenses
            </span>
            <span className="font-semibold text-[#0F172A] dark:text-white">
              ${appDetails?.expenses?.total || "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#667085] dark:text-[#A1A1AA]">
              Budget Remaining
            </span>
            <span className="font-semibold text-orange-600">
              ${appDetails?.expenses?.budget_remaining || "0.00"}
            </span>
          </div>
          <div className="pt-2">
            <a
              href={`/finance?app_id=${selectedApp.id}&tab=expenses`}
              className="text-sm text-[#0F172A] dark:text-[#4C9BFF] hover:underline"
            >
              Manage budget →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
