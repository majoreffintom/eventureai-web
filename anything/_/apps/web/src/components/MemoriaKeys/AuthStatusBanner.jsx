import { CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function AuthStatusBanner({
  isAuthenticated,
  isAdmin,
  user,
  includeInactive,
  setIncludeInactive,
  onRefresh,
  isLoading,
  tokensQueryError,
  adminStatusQueryError,
}) {
  const headerBadge = isAuthenticated
    ? isAdmin
      ? "Signed in (Memoria admin)"
      : "Signed in (not admin yet)"
    : "Sign in required";

  const headerTone = isAuthenticated
    ? isAdmin
      ? "bg-green-50 border-green-200"
      : "bg-gray-50 border-black/10"
    : "bg-gray-50 border-black/10";

  const headerIcon = isAuthenticated ? (isAdmin ? CheckCircle2 : Lock) : Lock;

  const HeaderIcon = headerIcon;

  return (
    <div className={`mt-5 p-4 rounded-xl border ${headerTone}`}>
      <div className="flex items-start gap-3">
        <HeaderIcon size={18} className="mt-0.5 text-[#0F172A]" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-[#0F172A]">
            {headerBadge}
          </div>
          <div className="mt-1 text-sm text-[#334155]">
            {isAuthenticated
              ? isAdmin
                ? "You can create/revoke Memoria API tokens here."
                : "To manage tokens, enable Memoria admin for your signed-in account."
              : "Sign in to manage Memoria API tokens."}
          </div>

          <div className="mt-2 text-sm text-[#334155]">
            {isAuthenticated && user?.email ? (
              <div>
                Signed in as <span className="font-semibold">{user.email}</span>
                .{" "}
                <a className="underline" href="/account/logout">
                  Sign out
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <a
                  className="underline"
                  href="/account/signin?callbackUrl=/memoria/keys"
                >
                  Sign in
                </a>
                <a
                  className="underline"
                  href="/account/signup?callbackUrl=/memoria/keys"
                >
                  Create account
                </a>
              </div>
            )}
          </div>

          {isAuthenticated && !isAdmin && (
            <div className="mt-3 text-sm">
              <a
                href="/memoria/bootstrap"
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-black text-white"
              >
                Enable Memoria admin
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={!isAdmin || isLoading}
          className="h-[44px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>

        <label className="h-[44px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Include inactive
        </label>
      </div>

      {(tokensQueryError || adminStatusQueryError) && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-300">
          {getErrorMessage(tokensQueryError || adminStatusQueryError)}
        </div>
      )}
    </div>
  );
}
