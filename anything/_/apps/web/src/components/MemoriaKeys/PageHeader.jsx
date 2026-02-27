import { KeyRound } from "lucide-react";

export function PageHeader() {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
            <KeyRound size={18} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-[28px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
              Memoria API Keys
            </h1>
            <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
              Create bearer tokens for safe, scoped read/write access to
              Memoria.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* add Admins link without changing existing layout */}
            <a
              href="/memoria/admins"
              className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
            >
              Admins
            </a>
            <a
              href="/memoria/uploader"
              className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
            >
              Uploader
            </a>
            <a
              href="/memoria/docs"
              className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
            >
              API Docs
            </a>
            <a
              href="/memory"
              className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
            >
              Open Memory
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
