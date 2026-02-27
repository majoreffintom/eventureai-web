import { CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

export function TokenListTable({
  tokens,
  isAdmin,
  isAuthenticated,
  isLoading,
  rateLimitEdits,
  setRateLimitEdits,
  onUpdateToken,
  onDuplicateToken,
  updateBusy,
  createBusy,
  setPageError,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
            Existing tokens
          </h2>
          <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
            Revoke (disable) tokens anytime. Secrets are never shown again.
          </p>
        </div>
        <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
          {updateBusy ? "Updating…" : ""}
        </div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#667085] dark:text-[#A1A1AA]">
              <th className="py-2 pr-4">Token ID</th>
              <th className="py-2 pr-4">Label</th>
              <th className="py-2 pr-4">app_source</th>
              <th className="py-2 pr-4">Perms</th>
              <th className="py-2 pr-4">Limit/min</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Last used</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => {
              const isActive = Boolean(t.is_active);
              const statusText = isActive ? "active" : "inactive";
              const statusIcon = isActive ? CheckCircle2 : XCircle;
              const StatusIcon = statusIcon;

              const perms = [];
              if (t.can_read) perms.push("read");
              if (t.can_write) perms.push("write");
              const permsText = perms.join("/") || "none";

              const lastUsed = formatDate(t.last_used_at);
              const created = formatDate(t.created_at);

              const rlValue =
                rateLimitEdits?.[t.token_id] ??
                String(t.rate_limit_per_minute ?? "");

              return (
                <tr
                  key={t.token_id}
                  className="border-t border-[#EAECF0] dark:border-[#404040]"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-[#0F172A] dark:text-white">
                    {t.token_id}
                  </td>
                  <td className="py-3 pr-4 text-[#0F172A] dark:text-white">
                    {t.label || ""}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-[#0F172A] dark:text-white">
                    {t.app_source}
                  </td>
                  <td className="py-3 pr-4 text-[#0F172A] dark:text-white">
                    {permsText}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <input
                        value={rlValue}
                        onChange={(e) =>
                          setRateLimitEdits((prev) => ({
                            ...(prev || {}),
                            [t.token_id]: e.target.value,
                          }))
                        }
                        className="w-[90px] h-[34px] px-2 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = Number(rlValue);
                          if (!Number.isFinite(v)) {
                            setPageError(
                              "Rate limit must be a number (requests per minute).",
                            );
                            return;
                          }
                          onUpdateToken({
                            tokenId: t.token_id,
                            rateLimitPerMinute: v,
                          });
                        }}
                        disabled={!isAdmin || updateBusy}
                        className="h-[34px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <StatusIcon
                        size={16}
                        className={isActive ? "text-green-600" : "text-red-600"}
                      />
                      <span className="text-[#0F172A] dark:text-white">
                        {statusText}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#0F172A] dark:text-white">
                    {lastUsed}
                  </td>
                  <td className="py-3 pr-4 text-[#0F172A] dark:text-white">
                    {created}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateToken({
                            tokenId: t.token_id,
                            isActive: !isActive,
                          })
                        }
                        disabled={!isAdmin || updateBusy}
                        className="h-[34px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
                      >
                        {isActive ? "Revoke" : "Re-enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateToken(t)}
                        disabled={!isAdmin || createBusy}
                        className="h-[34px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
                      >
                        Duplicate
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isAdmin && tokens.length === 0 && !isLoading && (
          <div className="mt-3 text-sm text-[#667085] dark:text-[#A1A1AA]">
            No tokens yet.
          </div>
        )}

        {!isAdmin && (
          <div className="mt-3 text-sm text-[#667085] dark:text-[#A1A1AA]">
            {isAuthenticated
              ? "You are signed in, but not a Memoria admin yet."
              : "Sign in to view tokens."}
          </div>
        )}
      </div>
    </div>
  );
}
