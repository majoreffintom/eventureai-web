import {
  Briefcase,
  LayoutDashboard,
  Settings,
  Calendar,
  Calculator,
  Brain,
  Building2,
} from "lucide-react";

export const STORAGE_KEY = "goldey_admin_tab_prefs_v1";

export function getDefaultTabs() {
  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      subtitle: "High-level snapshot: revenue, active jobs, team status.",
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      subtitle: "Calendar + assignments. Drag/drop will come later.",
    },
    // NOTE: Team/Trucks/Customers/Invoices/Reports now live inside Accounting to reduce clutter.
    {
      id: "jobs",
      label: "Jobs",
      icon: Briefcase,
      subtitle: "All work orders (scheduled, in-progress, completed).",
    },
    {
      id: "accounting",
      label: "Accounting",
      icon: Calculator,
      subtitle:
        "Accounting hub: cash, invoices, customers, team, fleet, and reports.",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      subtitle: "Tax rates, service catalog, integrations, preferences.",
    },

    // Config tabs (collapsed by default)
    {
      id: "tenants",
      label: "Tenants",
      icon: Building2,
      subtitle: "Manage platform tenants and their databases.",
      isConfig: true,
    },
    {
      id: "memory",
      label: "Memory",
      icon: Brain,
      subtitle: "Turn key conversations into fast recall notes.",
      isConfig: true,
    },
  ];
}

export function normalizeTabPrefs(defaultTabs, prefs) {
  const byId = new Map(defaultTabs.map((t) => [t.id, t]));

  const safeOrder = Array.isArray(prefs?.order) ? prefs.order : [];
  const filteredOrder = safeOrder.filter((id) => byId.has(id));

  const missingIds = defaultTabs
    .map((t) => t.id)
    .filter((id) => !filteredOrder.includes(id));

  const order = [...filteredOrder, ...missingIds];

  const safeLabels =
    prefs?.labels && typeof prefs.labels === "object" ? prefs.labels : {};
  const labels = {};
  for (const t of defaultTabs) {
    const maybe = safeLabels[t.id];
    labels[t.id] = typeof maybe === "string" && maybe.trim() ? maybe : t.label;
  }

  const showConfigTabs =
    typeof prefs?.showConfigTabs === "boolean" ? prefs.showConfigTabs : false;

  return { order, labels, showConfigTabs };
}
