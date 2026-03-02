"use client";

import { useEffect, useState } from "react";
import { 
  Monitor, 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Eye, 
  Layout, 
  Box,
  CheckCircle2
} from "lucide-react";
import { 
  IOSCard, 
  IOSPrimaryButton 
} from "@/src/components/ds/index.js";
import MarketingHeader from "@/src/components/Marketing/MarketingHeader";
import { DESIGNS } from "@/src/utils/design-registry";
import DesignRenderer from "@/src/components/Builder/DesignRenderer";

export default function AppBuilder() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(1);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);

  // Active config from the registry (looping back to 1 if not found for demo)
  const activeConfig = DESIGNS[currentDesignIndex] || DESIGNS[1];

  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await fetch("/api/tenants"); // Correct endpoint for tenants
        const data = await response.json();
        if (Array.isArray(data)) {
          setTenants(data);
          if (data.length > 0) {
            setSelectedTenant(data[0]);
            // If tenant already has a design_id, try to set the index
            const initialDesignId = data[0].design_id;
            if (initialDesignId) {
              const idx = Object.keys(DESIGNS).find(key => DESIGNS[Number(key)].id === initialDesignId);
              if (idx) setCurrentDesignIndex(Number(idx));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenants for builder", err);
      }
    }
    fetchTenants();
  }, []);

  const handleSave = async () => {
    if (!selectedTenant) return;
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/tenants/${selectedTenant.id}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: activeConfig.id }),
      });

      if (response.ok) {
        alert(`Successfully deployed ${activeConfig.name} to ${selectedTenant.name}`);
      } else {
        const err = await response.json();
        alert("Save failed: " + err.error);
      }
    } catch (err) {
      alert("Network error while deploying design.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-black flex flex-col">
      <MarketingHeader />
      
      {/* Builder Toolbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-3 flex items-center justify-between sticky top-[73px] z-40">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Target Tenant</span>
            <select 
              value={selectedTenant?.id}
              onChange={(e) => setSelectedTenant(tenants.find(t => t.id === e.target.value))}
              className="bg-transparent font-semibold outline-none cursor-pointer text-blue-500"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="h-8 w-px bg-black/10 mx-2" />
          
          <div className="flex items-center bg-black/5 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("desktop")}
              className={`p-2 rounded-lg transition-all ${viewMode === "desktop" ? "bg-white shadow-sm text-blue-500" : "text-black/40"}`}
            >
              <Monitor size={18} />
            </button>
            <button 
              onClick={() => setViewMode("mobile")}
              className={`p-2 rounded-lg transition-all ${viewMode === "mobile" ? "bg-white shadow-sm text-blue-500" : "text-black/40"}`}
            >
              <Smartphone size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <button 
              onClick={() => setCurrentDesignIndex(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/10"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Design Loop</span>
              <span className="font-bold text-lg">#{currentDesignIndex} / 55</span>
            </div>
            <button 
              onClick={() => setCurrentDesignIndex(prev => Math.min(55, prev + 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/10"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <IOSPrimaryButton 
            onClick={handleSave}
            disabled={isSaving}
            className="!w-auto !py-2 px-6"
          >
            <span className="flex items-center gap-2">
              <Save size={18} />
              {isSaving ? "Saving..." : "Deploy Design"}
            </span>
          </IOSPrimaryButton>
        </div>
      </div>

      {/* Preview Area */}
      <main className="flex-1 overflow-hidden bg-[#D1D1D6] p-8 flex justify-center items-start">
        <div 
          className={`bg-white shadow-2xl transition-all duration-500 overflow-hidden relative ${
            viewMode === "desktop" ? "w-full max-w-5xl aspect-video rounded-xl" : "w-[375px] h-[667px] rounded-[3rem] border-[8px] border-black"
          }`}
        >
          {/* Dynamic Design Engine Rendering */}
          <DesignRenderer 
            config={activeConfig} 
            tenantName={selectedTenant?.name || "Select Tenant"} 
          />

          {/* Status Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-lg">
            <div className="flex items-center gap-2 text-black">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-xs font-semibold">Live Preview: {activeConfig.name}</span>
            </div>
            <div className="flex items-center gap-2 text-black">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Active ID</span>
              <code className="text-[10px] bg-black/5 px-2 py-1 rounded">{activeConfig.id}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
