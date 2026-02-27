import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  ClipboardList,
  ReceiptText,
  Truck,
  Users,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Panel, Table, Text } from "@/components/ds.jsx";
import { TeamTab } from "@/components/admin/TeamTab/TeamTab";
import { PlaceholderTab } from "@/components/admin/PlaceholderTab";

function formatMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) {
    return "—";
  }
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <div className="text-xs font-semibold text-[var(--ds-text-tertiary)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--ds-text-primary)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-xs text-[var(--ds-text-tertiary)]">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

const ACCOUNTING_SUBTABS = [
  {
    id: "overview",
    label: "Overview",
    icon: ClipboardList,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: ReceiptText,
  },
  {
    id: "customers",
    label: "Customers",
    icon: Building2,
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
  },
  {
    id: "trucks",
    label: "Trucks",
    icon: Truck,
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
  },
];

function getInitialSubtab() {
  if (typeof window === "undefined") {
    return "overview";
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("subtab");
    const exists = ACCOUNTING_SUBTABS.some((t) => t.id === requested);
    return exists ? requested : "overview";
  } catch {
    return "overview";
  }
}

function updateUrlSubtab(nextSubtab) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "accounting");
    url.searchParams.set("subtab", nextSubtab);
    window.history.pushState({}, "", url);
  } catch (e) {
    console.error(e);
  }
}

function AccountingOverview() {
  const summaryQuery = useQuery({
    queryKey: ["admin", "accounting", "summary"],
    queryFn: async () => {
      const response = await fetch("/api/admin/accounting/summary", {
        method: "GET",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.error || "Could not load accounting";
        throw new Error(msg);
      }
      return json;
    },
  });

  const summary = summaryQuery.data || null;
  const cashTotal = summary?.cash?.total ?? null;
  const cashAccounts = Array.isArray(summary?.cash?.accounts)
    ? summary.cash.accounts
    : [];

  const arTotal = summary?.ar?.total ?? null;
  const apTotal = summary?.ap?.total ?? null;

  const revenue30 = summary?.profit?.revenue_30 ?? null;
  const expenses30 = summary?.profit?.expenses_30 ?? null;
  const net30 = summary?.profit?.net_30 ?? null;

  const series = useMemo(() => {
    const rows = Array.isArray(summary?.series) ? summary.series : [];
    return rows.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue) || 0,
      expenses: Number(r.expenses) || 0,
    }));
  }, [summary]);

  const netTone = useMemo(() => {
    const n = Number(net30);
    if (!Number.isFinite(n)) {
      return "secondary";
    }
    return n >= 0 ? "primary" : "danger";
  }, [net30]);

  const profitStatusLine = useMemo(() => {
    const n = Number(net30);
    if (!Number.isFinite(n)) {
      return "Not enough data yet";
    }
    return n >= 0
      ? "Profit trend looks positive"
      : "Net is negative — worth a look";
  }, [net30]);

  const cashColumns = useMemo(() => {
    return [
      {
        key: "name",
        header: "Account",
        render: (r) => <span className="font-semibold">{r.name}</span>,
      },
      {
        key: "balance",
        header: "Balance",
        render: (r) => <span>{formatMoney(r.balance)}</span>,
      },
    ];
  }, []);

  if (summaryQuery.isLoading) {
    return (
      <Panel title="Accounting" subtitle="Loading…">
        <Text tone="secondary">Loading accounting…</Text>
      </Panel>
    );
  }

  if (summaryQuery.error) {
    return (
      <Panel title="Accounting" subtitle="Could not load">
        <Text tone="danger">{summaryQuery.error?.message || "Error"}</Text>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Accounting"
        subtitle="Cash, AR/AP, and a simple profit snapshot. We can keep building this into a full general ledger."
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Cash (bank balances)"
            value={formatMoney(cashTotal)}
            hint="Opening balance + transactions"
          />
          <StatCard
            label="Accounts receivable"
            value={formatMoney(arTotal)}
            hint="Open invoice balances"
          />
          <StatCard
            label="Accounts payable"
            value={formatMoney(apTotal)}
            hint="Open vendor bills"
          />
          <StatCard
            label="Net (last 30 days)"
            value={formatMoney(net30)}
            hint="Invoices minus expenses"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Revenue (last 30 days)"
            value={formatMoney(revenue30)}
          />
          <StatCard
            label="Expenses (last 30 days)"
            value={formatMoney(expenses30)}
          />
          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
            <div className="text-xs font-semibold text-[var(--ds-text-tertiary)]">
              Status
            </div>
            <div className="mt-2">
              <Text tone={netTone} className="font-semibold">
                {profitStatusLine}
              </Text>
              <Text size="sm" tone="tertiary" className="mt-2">
                Next step is tying inventory usage + timeclock to jobs so job
                costing is automatic.
              </Text>
            </div>
          </div>
        </div>

        {cashAccounts.length ? (
          <div className="mt-6 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
            <Text className="font-semibold" tone="primary">
              Bank accounts
            </Text>
            <div className="mt-3">
              <Table columns={cashColumns} rows={cashAccounts} />
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
          <Text className="font-semibold" tone="primary">
            Revenue vs Expenses (last 6 months)
          </Text>
          <div className="mt-3 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    const label = name === "revenue" ? "Revenue" : "Expenses";
                    return [formatMoney(value), label];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Text size="xs" tone="tertiary" className="mt-3">
            This is a quick operational view. If you want, we can add a proper
            Chart of Accounts view, journal entries, and bank reconciliation.
          </Text>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
          <Text className="font-semibold" tone="primary">
            Coming next (when you want it)
          </Text>
          <ul className="mt-3 list-disc pl-5 text-sm text-[var(--ds-text-secondary)] space-y-1">
            <li>Bank reconciliation (match imports to GL)</li>
            <li>Vendor bills + approvals → post to GL automatically</li>
            <li>Job costing: labor + parts used → margin by job</li>
            <li>Tax reports + export for your CPA</li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}

export function AccountingTab() {
  const [subtab, setSubtab] = useState(getInitialSubtab);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("subtab");
        const exists = ACCOUNTING_SUBTABS.some((t) => t.id === requested);
        if (exists && requested !== subtab) {
          setSubtab(requested);
        }
      } catch (e) {
        console.error(e);
      }
    };

    applyFromUrl();
    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, [subtab]);

  const activeMeta = useMemo(() => {
    const found = ACCOUNTING_SUBTABS.find((t) => t.id === subtab);
    return found || ACCOUNTING_SUBTABS[0];
  }, [subtab]);

  const body = useMemo(() => {
    if (subtab === "overview") {
      return <AccountingOverview />;
    }
    if (subtab === "team") {
      return <TeamTab />;
    }

    if (subtab === "invoices") {
      return (
        <PlaceholderTab
          title="Invoices"
          subtitle="Billing lives here. Next we can add invoice list, payments, and posting to the general ledger."
        />
      );
    }

    if (subtab === "customers") {
      return (
        <PlaceholderTab
          title="Customers"
          subtitle="Customer list + balance history. Next we can add customer aging and lifetime value."
        />
      );
    }

    if (subtab === "trucks") {
      return (
        <PlaceholderTab
          title="Trucks"
          subtitle="Fleet costs (fuel, repairs, depreciation) and assignments. We can tie this to jobs + expense tracking."
        />
      );
    }

    if (subtab === "reports") {
      return (
        <PlaceholderTab
          title="Reports"
          subtitle="Profitability, AR/AP aging, job margins, and export for your CPA."
        />
      );
    }

    return <AccountingOverview />;
  }, [subtab]);

  return (
    <div className="space-y-4">
      <Panel
        title="Accounting"
        subtitle="Your accounting hub: invoices, customers, team, fleet, and reports."
      >
        <div className="flex flex-wrap gap-2">
          {ACCOUNTING_SUBTABS.map((t) => {
            const isActive = t.id === subtab;
            const Icon = t.icon;
            const variant = isActive ? "primary" : "secondary";

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSubtab(t.id);
                  updateUrlSubtab(t.id);
                }}
                className={
                  variant === "primary"
                    ? "inline-flex items-center gap-2 rounded-xl bg-[var(--ds-brand)] text-white px-3 py-2 text-sm font-semibold"
                    : "inline-flex items-center gap-2 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] text-[var(--ds-text-primary)] px-3 py-2 text-sm font-semibold"
                }
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
        <Text size="xs" tone="tertiary" className="mt-3">
          You’re viewing:{" "}
          <span className="font-semibold">{activeMeta.label}</span>
        </Text>
      </Panel>

      {body}
    </div>
  );
}
