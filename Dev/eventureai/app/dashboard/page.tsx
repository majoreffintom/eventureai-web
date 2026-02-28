"use client";

import { useEffect, useState } from "react";
import { 
  Layout, 
  Settings, 
  Users, 
  Plus, 
  ExternalLink, 
  ChevronRight,
  Globe,
  ShieldCheck
} from "lucide-react";
import { 
  IOSCard, 
  IOSListCard, 
  IOSPrimaryButton 
} from "@/src/components/ds/index.js";
import MarketingHeader from "@/src/components/Marketing/MarketingHeader";

export default function OrganizationDashboard() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/organizations");
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Failed to fetch from local DB:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newOrgName, 
          slug: newOrgSlug || newOrgName.toLowerCase().replace(/\s+/g, '-') 
        }),
      });

      if (response.ok) {
        setNewOrgName("");
        setNewOrgSlug("");
        setIsModalOpen(false);
        fetchOrgs();
      } else {
        const err = await response.json();
        alert("Error: " + err.error);
      }
    } catch (error) {
      alert("Failed to connect to local API");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-black">
      <MarketingHeader />
      
      {/* New Org Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <IOSCard className="w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6">New Organization</h2>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black/50 uppercase mb-1 ml-1">Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 border border-transparent focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-black/50 uppercase mb-1 ml-1">Slug</label>
                <input 
                  type="text" 
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 border border-transparent focus:border-blue-500 outline-none transition-all"
                  placeholder="acme-corp"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-semibold active:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <IOSPrimaryButton 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 !py-4"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </IOSPrimaryButton>
              </div>
            </form>
          </IOSCard>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Organizations</h1>
            <p className="text-black/55 mt-1">Manage your tenants and app designs.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto py-3 px-6 bg-[#007AFF] text-white rounded-full font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            New Org
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <IOSCard className="p-1">
              <div className="px-6 py-4 border-b border-black/5">
                <h2 className="text-sm font-semibold tracking-widest uppercase text-black/50">Active Tenants</h2>
              </div>
              <div className="divide-y divide-black/5">
                {organizations.map((org) => (
                  <button 
                    key={org.id}
                    className="w-full text-left px-6 py-5 flex items-center justify-between active:bg-black/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-black/5">
                        <span className="text-xl font-bold text-black/20">
                          {org.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-lg flex items-center gap-2">
                          {org.name}
                          {org.status === "active" && (
                            <ShieldCheck size={14} className="text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-black/45">
                          eventureai.com/{org.slug}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col items-end mr-4">
                        <span className="text-xs font-medium uppercase tracking-tighter text-black/40">Designs</span>
                        <span className="font-semibold">{org.design_count || 0}</span>
                      </div>
                      <ChevronRight size={20} className="text-black/20 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </IOSCard>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <IOSCard className="p-6">
              <h3 className="font-bold text-xl mb-4">Builder Stats</h3>
              <IOSListCard className="bg-transparent shadow-none border-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-black/70">
                      <Globe size={18} />
                      <span>Total Orgs</span>
                    </div>
                    <span className="font-bold">{organizations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-black/70">
                      <Layout size={18} />
                      <span>Designs Used</span>
                    </div>
                    <span className="font-bold text-blue-500">9 / 55</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-black/70">
                      <Users size={18} />
                      <span>Total Users</span>
                    </div>
                    <span className="font-bold">142</span>
                  </div>
                </div>
              </IOSListCard>
            </IOSCard>

            <IOSCard className="p-6 bg-blue-500 text-white" style={{ backgroundColor: '#007AFF' }}>
              <Settings size={24} className="mb-4" />
              <h3 className="font-bold text-xl mb-2">App Builder</h3>
              <p className="text-white/80 text-sm mb-6">
                Open the design engine to modify themes for your 55 custom templates.
              </p>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-semibold backdrop-blur-md transition-colors text-center">
                Launch Engine
              </button>
            </IOSCard>
          </div>
        </div>
      </main>
    </div>
  );
}
