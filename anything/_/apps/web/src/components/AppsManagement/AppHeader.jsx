import { Globe, Plus } from "lucide-react";
import { useState } from "react";

export function AppHeader({ onAddApp }) {
  const [pressedButton, setPressedButton] = useState(null);

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Globe size={32} className="text-[#0F172A] dark:text-white" />
              <h1 className="font-bold text-[32px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                Apps & Domains
              </h1>
              <span className="inline-flex items-center px-[10px] py-[6px] rounded-full border bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white text-[11px] font-semibold tracking-[0.4em] font-inter">
                PORTFOLIO
              </span>
            </div>
            <p className="text-[16px] leading-[1.2] text-[#667085] dark:text-[#A1A1AA] font-inter max-w-[600px]">
              Manage your app portfolio, domains, and business applications.
              Track revenue, expenses, and performance across your entire
              ecosystem.
            </p>
          </div>

          <button
            onClick={onAddApp}
            onMouseDown={() => setPressedButton("add-app")}
            onMouseUp={() => setPressedButton(null)}
            onMouseLeave={() => setPressedButton(null)}
            className={`
              flex items-center gap-2 h-[40px] px-6 rounded-full transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 text-sm font-semibold font-inter
              bg-[#0F172A] hover:bg-[#17233A] text-white
              ${pressedButton === "add-app" ? "transform scale-95" : ""}
            `}
          >
            <Plus size={16} />
            Add App
          </button>
        </div>
      </div>
    </div>
  );
}
