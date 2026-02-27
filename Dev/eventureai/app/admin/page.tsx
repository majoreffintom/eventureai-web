"use client";

import { 
  BarChart3, 
  Users, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  ShieldCheck,
  Activity
} from "lucide-react";
import { 
  IOSCard, 
  IOSListCard 
} from "@/src/components/ds/index.js";
import MarketingHeader from "@/src/components/Marketing/MarketingHeader";

const STATS = [
  { label: "Active Tenants", value: "9", trend: "+12%", up: true, icon: Database },
  { label: "Total Users", value: "1,429", trend: "+5.4%", up: true, icon: Users },
  { label: "System Load", value: "24%", trend: "-2%", up: false, icon: Activity },
  { label: "Security Events", value: "0", trend: "Stable", up: true, icon: ShieldCheck },
];

const RECENT_ACTIVITY = [
  { id: 1, user: "Admin", action: "Created Tenant", target: "Rosebud", time: "2m ago", status: "Success" },
  { id: 2, user: "System", action: "DB Backup", target: "mori_main", time: "45m ago", status: "Success" },
  { id: 3, user: "Goldey_User", action: "Update Design", target: "Design #55", time: "1h ago", status: "Success" },
  { id: 4, user: "Security", action: "Login Attempt", target: "192.168.1.1", time: "3h ago", status: "Warning" },
];

export default function AdminTemplate() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] text-black">
      <MarketingHeader />
      
      <div className="flex max-w-[1400px] mx-auto px-4 sm:px-6 py-8 gap-8">
        
        {/* Simple Frosted Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 gap-2">
          <div className="px-4 py-2 text-[10px] font-bold text-black/40 uppercase tracking-widest">Navigation</div>
          <nav className="space-y-1">
            <SidebarItem icon={<BarChart3 size={18}/>} label="Overview" active />
            <SidebarItem icon={<Database size={18}/>} label="Tenants" />
            <SidebarItem icon={<Users size={18}/>} label="Users" />
            <SidebarItem icon={<Settings size={18}/>} label="System Config" />
          </nav>
          
          <div className="mt-8 px-4 py-2 text-[10px] font-bold text-black/40 uppercase tracking-widest">Resources</div>
          <nav className="space-y-1">
            <SidebarItem icon={<Bell size={18}/>} label="Notifications" badge="3" />
            <SidebarItem icon={<ShieldCheck size={18}/>} label="Security Logs" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
              <p className="text-black/50">Managing EventureAI and MORI core.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={16} />
                <input 
                  type="text" 
                  placeholder="Search MORI..." 
                  className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-md border border-black/5 rounded-full text-sm outline-none focus:bg-white transition-all w-48 sm:w-64"
                />
              </div>
              <button className="w-10 h-10 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center active:scale-95 transition-transform">
                <Plus size={20} />
              </button>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <IOSCard key={stat.label} className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-black/5 text-black/60">
                    <stat.icon size={20} />
                  </div>
                  <div className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${
                    stat.up ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                  }`}>
                    {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.trend}
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <div className="text-xs text-black/40 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
              </IOSCard>
            ))}
          </div>

          {/* Recent Activity Table */}
          <IOSCard className="overflow-hidden">
            <div className="px-6 py-5 border-b border-black/5 flex justify-between items-center">
              <h2 className="font-bold text-lg">System Activity</h2>
              <button className="text-blue-500 text-sm font-semibold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] text-[10px] font-bold text-black/40 uppercase tracking-widest">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {RECENT_ACTIVITY.map((item) => (
                    <tr key={item.id} className="group hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {item.user.charAt(0)}
                          </div>
                          <span className="font-semibold text-sm">{item.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-black/70">{item.action}</td>
                      <td className="px-6 py-4 text-sm font-mono text-black/50">{item.target}</td>
                      <td className="px-6 py-4 text-sm text-black/40">{item.time}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          item.status === "Success" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IOSCard>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, badge = null }: any) {
  return (
    <button className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all active:scale-95 ${
      active ? "bg-white shadow-sm text-blue-500 font-semibold" : "text-black/60 hover:bg-black/5"
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm tracking-wide">{label}</span>
      </div>
      {badge && (
        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
