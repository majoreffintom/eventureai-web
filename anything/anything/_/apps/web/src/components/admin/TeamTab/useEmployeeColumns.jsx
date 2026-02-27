import { useCallback, useMemo } from "react";
import { Button, Text } from "@/components/ds.jsx";

export function useEmployeeColumns(toggleActiveMutation) {
  const splitName = useCallback((fullName) => {
    const raw = typeof fullName === "string" ? fullName.trim() : "";
    if (!raw) {
      return { firstName: "", lastName: "" };
    }
    const parts = raw.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  }, []);

  const employeeColumns = useMemo(
    () => [
      {
        key: "first_name",
        header: "First name",
        render: (r) => {
          const names = splitName(r.name);
          return (
            <Text as="div" tone="primary" className="font-semibold">
              {names.firstName || "—"}
            </Text>
          );
        },
      },
      {
        key: "last_name",
        header: "Last name",
        render: (r) => {
          const names = splitName(r.name);
          return (
            <div>
              <Text as="div" tone="primary" className="font-semibold">
                {names.lastName || "—"}
              </Text>
              {r.email ? (
                <Text as="div" size="xs" tone="tertiary" className="mt-1">
                  {r.email}
                </Text>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "role",
        header: "Roles",
        render: (r) => {
          const roles = Array.isArray(r.roles) ? r.roles.filter(Boolean) : [];
          const fallback = r.role ? [r.role] : [];
          const shown = roles.length ? roles : fallback;

          return shown.length ? (
            <div className="flex flex-wrap gap-2">
              {shown.map((rr) => (
                <span
                  key={rr}
                  className="inline-flex items-center h-7 px-3 rounded-full border border-[var(--ds-border)] bg-[var(--ds-bg-tertiary)] text-xs font-semibold text-[var(--ds-text-secondary)]"
                >
                  {rr}
                </span>
              ))}
            </div>
          ) : (
            <Text as="div" size="sm" tone="secondary">
              —
            </Text>
          );
        },
      },
      {
        key: "pay",
        header: "Pay",
        render: (r) => {
          const isHourly = r.pay_type === "hourly";
          const rate = isHourly ? r.hourly_rate : r.salary_annual;
          const label = isHourly ? "hr" : "yr";
          const rateStr =
            typeof rate === "number" || typeof rate === "string"
              ? String(rate)
              : "";

          return (
            <Text as="div" size="sm" tone="secondary">
              {r.pay_type} {rateStr ? `($${rateStr}/${label})` : ""}
            </Text>
          );
        },
      },
      {
        key: "is_active",
        header: "Status",
        render: (r) => {
          const statusText = r.is_active ? "Active" : "Inactive";
          const badgeCls = r.is_active
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-50 text-gray-700 border-gray-200";

          return (
            <span
              className={`inline-flex items-center h-7 px-3 rounded-full border text-xs font-semibold ${badgeCls}`}
            >
              {statusText}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (r) => {
          const nextActive = !r.is_active;
          const btnLabel = r.is_active ? "Deactivate" : "Activate";

          return (
            <Button
              size="sm"
              variant="secondary"
              disabled={toggleActiveMutation.isPending}
              onClick={() =>
                toggleActiveMutation.mutate({ id: r.id, is_active: nextActive })
              }
            >
              {btnLabel}
            </Button>
          );
        },
      },
    ],
    [splitName, toggleActiveMutation],
  );

  return employeeColumns;
}
