"use client";

import { useState } from "react";
import { Check, Loader2, Zap, Shield, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "pro",
    name: "PRO",
    price: "$29",
    description: "Perfect for individual creators and small projects.",
    features: ["Unlimited Apps", "Custom Subdomains", "Priority Build Queue", "Basic AI Swarm"],
    icon: Zap,
  },
  {
    id: "swarm",
    name: "SWARM",
    price: "$99",
    description: "Scale your productivity with advanced AI coordination.",
    features: ["Everything in Pro", "Advanced Swarm Logic", "Full webMCP Access", "Custom API Endpoints"],
    icon: Shield,
    featured: true,
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    price: "Custom",
    description: "Total control and dedicated resources for your business.",
    features: ["Everything in Swarm", "White-label Options", "Dedicated AI Nodes", "24/7 Priority Support"],
    icon: Crown,
  },
];

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, tenantId: "user-123" }), // TODO: Get actual tenant
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Error starting checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black pt-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col mb-16">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8 hover:text-black transition-colors">
            ← BACK TO HOME
          </Link>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85]">
            Simple.<br />Fair. Scale.
          </h1>
          <p className="text-xl text-zinc-500 mt-8 max-w-xl font-medium leading-tight">
            Choose the plan that fits your vision. All plans include our core visual builder and instant deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`p-8 border ${plan.featured ? 'border-black bg-zinc-50/50' : 'border-zinc-100'} flex flex-col`}
            >
              <div className="mb-8">
                 <div className={`w-12 h-12 ${plan.featured ? 'bg-black text-white' : 'bg-zinc-100 text-black'} rounded-lg flex items-center justify-center mb-6`}>
                    <plan.icon size={24} />
                 </div>
                 <h2 className="text-sm font-bold uppercase tracking-widest mb-1">{plan.name}</h2>
                 <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold tracking-tighter">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-xs font-bold text-zinc-400">/MO</span>}
                 </div>
                 <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                   {plan.description}
                 </p>
              </div>

              <div className="flex-1 flex flex-col gap-4 mb-12">
                 {plan.features.map(feature => (
                   <div key={feature} className="flex items-center gap-3">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{feature}</span>
                   </div>
                 ))}
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  plan.featured 
                    ? 'bg-black text-white hover:bg-zinc-800' 
                    : 'bg-white border border-zinc-200 text-black hover:bg-zinc-50'
                } flex items-center justify-center`}
              >
                {loadingPlan === plan.id ? <Loader2 size={16} className="animate-spin" /> : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
