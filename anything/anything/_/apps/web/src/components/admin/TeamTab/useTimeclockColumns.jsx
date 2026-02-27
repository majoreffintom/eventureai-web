import { useMemo } from "react";
import { Text } from "@/components/ds.jsx";

export function useTimeclockColumns() {
  const timeclockColumns = useMemo(
    () => [
      {
        key: "employee_name",
        header: "Employee",
        render: (r) => (
          <Text as="div" tone="primary" className="font-semibold">
            {r.employee_name}
          </Text>
        ),
      },
      {
        key: "clock_in",
        header: "Clock in",
        render: (r) => {
          const d = r.clock_in ? new Date(r.clock_in) : null;
          const text = d ? d.toLocaleString() : "—";
          return (
            <Text as="div" size="sm" tone="secondary">
              {text}
            </Text>
          );
        },
      },
      {
        key: "clock_out",
        header: "Clock out",
        render: (r) => {
          const d = r.clock_out ? new Date(r.clock_out) : null;
          const text = d ? d.toLocaleString() : "—";
          return (
            <Text as="div" size="sm" tone="secondary">
              {text}
            </Text>
          );
        },
      },
      {
        key: "total_minutes",
        header: "Minutes",
        render: (r) => (
          <Text as="div" size="sm" tone="secondary">
            {typeof r.total_minutes === "number" ? r.total_minutes : "—"}
          </Text>
        ),
      },
      {
        key: "job_number",
        header: "Job",
        render: (r) => {
          const jobLabel = r.job_number ? `#${r.job_number}` : "—";
          const status = r.job_status || null;
          const statusText = status ? ` (${status})` : "";
          const out = `${jobLabel}${statusText}`;

          return (
            <Text as="div" size="sm" tone="secondary">
              {out}
            </Text>
          );
        },
      },
      {
        key: "status",
        header: "Entry",
        render: (r) => {
          const et = r.entry_type || "—";
          const st = r.status || "—";
          const out = `${et} • ${st}`;
          return (
            <Text as="div" size="sm" tone="secondary">
              {out}
            </Text>
          );
        },
      },
    ],
    [],
  );

  return timeclockColumns;
}
