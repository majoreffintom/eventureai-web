import { LayoutGrid, MessageSquare, Settings, Users, Wand2, Database, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const items = [
    { icon: LayoutGrid, label: "Builder", active: true },
    { icon: Users, label: "Swarm", active: false },
    { icon: Database, label: "Data", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <div className="w-16 flex flex-col items-center py-4 bg-white border-r border-zinc-100 shrink-0">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
          <Wand2 size={24} />
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center gap-4">
        {items.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              item.active 
                ? "bg-zinc-100 text-black" 
                : "text-zinc-400 hover:text-black hover:bg-zinc-50"
            )}
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        ))}
      </div>
      
      <div className="mt-auto">
        <button className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors">
          <Play size={18} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
