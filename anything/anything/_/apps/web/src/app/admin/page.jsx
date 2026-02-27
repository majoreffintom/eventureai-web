"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button, Page, Panel, Text } from "@/components/ds.jsx";
import { useAdminAuth } from "@/utils/admin/useAdminAuth";
import { useTabPreferences } from "@/utils/admin/useTabPreferences";
import { AdminAccessGuard } from "@/components/admin/AdminAccessGuard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTabsBar } from "@/components/admin/AdminTabsBar";
import { PlaceholderTab } from "@/components/admin/PlaceholderTab";
import { InventoryTab } from "@/components/admin/InventoryTab/InventoryTab";
import { AccountingTab } from "@/components/admin/AccountingTab/AccountingTab";
import { MemoryTab } from "@/components/admin/MemoryTab/MemoryTab";
import { TenantsTab } from "@/components/admin/TenantsTab/TenantsTab";

export default function AdminPage() {
  const {
    isCheckingAccess,
    accessError,
    isAuthenticated,
    isAdmin,
    signedInEmail,
  } = useAdminAuth();

  const {
    tabs,
    editingId,
    editMode,
    setEditMode,
    showConfigTabs,
    setShowConfigTabs,
    handleReorder,
    handleStartRename,
    handleCancelRename,
    handleCommitRename,
    handleResetTabs,
  } = useTabPreferences();

  const [active, setActive] = useState("dashboard");
  const [didApplyDeepLink, setDidApplyDeepLink] = useState(false);

  // allow deep-links like /admin?tab=inventory (used by QR stickers)
  // and legacy deep-links like /admin?tab=invoices which now live under Accounting.
  useEffect(() => {
    if (didApplyDeepLink) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (!tabs || !tabs.length) {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("tab");
      if (!requested) {
        setDidApplyDeepLink(true);
        return;
      }

      const legacyAccountingTabs = new Set([
        "team",
        "trucks",
        "customers",
        "invoices",
        "reports",
      ]);

      if (legacyAccountingTabs.has(requested)) {
        // Move legacy links to the new accounting hub structure.
        setActive("accounting");
        const next = new URL(window.location.href);
        next.searchParams.set("tab", "accounting");
        next.searchParams.set("subtab", requested);
        window.history.replaceState({}, "", next);
        setDidApplyDeepLink(true);
        return;
      }

      // Support both legacy "dashboard" id and a future "inventory" id.
      const requestedId = requested === "inventory" ? "dashboard" : requested;

      const exists = (tabs || []).some((t) => t.id === requestedId);
      if (exists) {
        setActive(requestedId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDidApplyDeepLink(true);
    }
  }, [didApplyDeepLink, tabs]);

  const configTabs = useMemo(() => {
    return (tabs || []).filter((t) => !!t?.isConfig);
  }, [tabs]);

  const primaryTabIds = useMemo(() => {
    return (tabs || []).filter((t) => !t?.isConfig).map((t) => t.id);
  }, [tabs]);

  const activeTab = useMemo(() => {
    const found = tabs.find((t) => t.id === active);
    return found || tabs[0] || null;
  }, [active, tabs]);

  // If config tabs are "parked" (collapsed), don't allow a config tab to remain active.
  useEffect(() => {
    if (editMode) {
      return;
    }
    if (showConfigTabs) {
      return;
    }
    if (!activeTab?.isConfig) {
      return;
    }

    const fallbackId = primaryTabIds[0];
    if (fallbackId && fallbackId !== active) {
      setActive(fallbackId);
    }
  }, [active, activeTab, editMode, primaryTabIds, showConfigTabs]);

  useEffect(() => {
    if (!activeTab) {
      return;
    }
    if (active !== activeTab.id) {
      setActive(activeTab.id);
    }
  }, [active, activeTab]);

  const content = activeTab ? (
    activeTab.id === "inventory" || activeTab.id === "dashboard" ? (
      <InventoryTab />
    ) : activeTab.id === "accounting" ? (
      <AccountingTab />
    ) : activeTab.id === "memory" ? (
      <MemoryTab />
    ) : activeTab.id === "tenants" ? (
      <TenantsTab />
    ) : (
      <PlaceholderTab title={activeTab.label} subtitle={activeTab.subtitle} />
    )
  ) : (
    <Panel title="Admin" subtitle="Loading…" />
  );

  const showConfigPanel = !editMode && configTabs.length > 0;
  const configToggleIcon = showConfigTabs ? ChevronUp : ChevronDown;
  const configToggleLabel = showConfigTabs ? "Hide" : "Show";

  return (
    <AdminAccessGuard
      isCheckingAccess={isCheckingAccess}
      accessError={accessError}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      signedInEmail={signedInEmail}
    >
      <Page
        header={<SiteHeader variant="admin" />}
        footer={null}
        contentClassName="pt-4 md:pt-6"
      >
        <AdminHeader
          editMode={editMode}
          onToggleEditMode={() => {
            setEditMode((v) => {
              const next = !v;
              if (next) {
                setShowConfigTabs(true);
              }
              return next;
            });
          }}
          onResetTabs={handleResetTabs}
        />

        <AdminTabsBar
          tabs={tabs}
          activeId={active}
          onChange={setActive}
          onReorder={handleReorder}
          editingId={editingId}
          onStartRename={handleStartRename}
          onCommitRename={handleCommitRename}
          onCancelRename={handleCancelRename}
          editMode={editMode}
          hiddenTabIds={editMode ? [] : configTabs.map((t) => t.id)}
        />

        {showConfigPanel ? (
          <div className="mt-3">
            <Panel
              title="Configuration"
              subtitle="Stuff you don’t touch every day."
              right={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={configToggleIcon}
                  onClick={() => setShowConfigTabs((v) => !v)}
                >
                  {configToggleLabel}
                </Button>
              }
            >
              {showConfigTabs ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {configTabs.map((t) => {
                      const isActive = active === t.id;
                      const Icon = t.icon;
                      const variant = isActive ? "primary" : "secondary";
                      return (
                        <Button
                          key={t.id}
                          variant={variant}
                          size="sm"
                          icon={Icon}
                          onClick={() => setActive(t.id)}
                        >
                          {t.label}
                        </Button>
                      );
                    })}
                  </div>

                  <Text size="xs" tone="tertiary" className="mt-3">
                    Tip: keep this collapsed most of the time to stay focused on
                    jobs, invoices, and schedule.
                  </Text>
                </div>
              ) : null}
            </Panel>
          </div>
        ) : null}

        <div className="mt-6">{content}</div>
      </Page>
    </AdminAccessGuard>
  );
}
