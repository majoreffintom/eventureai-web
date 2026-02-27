"use client";

import { useState } from "react";
import { useApps } from "@/hooks/useApps";
import { useAppDetails } from "@/hooks/useAppDetails";
import { useAppSecrets } from "@/hooks/useAppSecrets";
import { AppHeader } from "@/components/AppsManagement/AppHeader";
import { AppsList } from "@/components/AppsManagement/AppsList";
import { AppDetailsHeader } from "@/components/AppsManagement/AppDetailsHeader";
import { AppOverview } from "@/components/AppsManagement/AppOverview";
import { FinancialOverview } from "@/components/AppsManagement/FinancialOverview";
import { QuickActions } from "@/components/AppsManagement/QuickActions";
import { SecretsManagement } from "@/components/AppsManagement/SecretsManagement";
import MemoriaIntegration from "@/components/AppsManagement/MemoriaIntegration";
import { EmptyState } from "@/components/AppsManagement/EmptyState";
import AddAppModal from "@/components/AppsManagement/AddAppModal";

export default function AppsManagementPage() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { apps, isLoading } = useApps();
  const { appDetails } = useAppDetails(selectedApp);
  const {
    secretsData,
    secretsLoading,
    saveSecretMutation,
    deleteSecretMutation,
  } = useAppSecrets(selectedApp);

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <AppHeader onAddApp={() => setShowAddModal(true)} />

      <AddAppModal open={showAddModal} onClose={() => setShowAddModal(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Apps List */}
          <div className="lg:col-span-4">
            <AppsList
              apps={apps}
              isLoading={isLoading}
              selectedApp={selectedApp}
              onSelectApp={handleSelectApp}
            />
          </div>

          {/* App Details */}
          <div className="lg:col-span-8">
            {selectedApp ? (
              <div className="space-y-6">
                <AppDetailsHeader
                  selectedApp={selectedApp}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />

                {/* Tab Content */}
                {activeTab === "overview" && (
                  <>
                    <AppOverview selectedApp={selectedApp} />
                    <FinancialOverview
                      selectedApp={selectedApp}
                      appDetails={appDetails}
                    />
                    <QuickActions
                      selectedApp={selectedApp}
                      onSecretsClick={() => setActiveTab("secrets")}
                    />
                  </>
                )}

                {activeTab === "memoria" && (
                  <MemoriaIntegration
                    selectedApp={selectedApp}
                    secretsData={secretsData}
                  />
                )}

                {/* Secrets Management Tab */}
                {activeTab === "secrets" && (
                  <SecretsManagement
                    selectedApp={selectedApp}
                    secretsData={secretsData}
                    secretsLoading={secretsLoading}
                    saveSecretMutation={saveSecretMutation}
                    deleteSecretMutation={deleteSecretMutation}
                  />
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
