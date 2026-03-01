import { Type, SquareSquare, Image as ImageIcon, BoxSelect } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

const components = [
  { type: "text", label: "Text", icon: Type },
  { type: "button", label: "Button", icon: SquareSquare },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "container", label: "Container", icon: BoxSelect },
];

function DraggableComponent({ type, label, icon: Icon }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${type}`,
    data: { type, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-xl border border-zinc-100 bg-white flex flex-col items-center justify-center gap-2 cursor-grab hover:border-black hover:bg-zinc-50 transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Icon size={20} className="text-zinc-400 group-hover:text-black" />
      <span className="text-xs font-medium text-zinc-500">{label}</span>
    </div>
  );
}

export function Palette() {
  return (
    <div className="w-64 bg-white border-r border-zinc-100 flex flex-col h-full shrink-0">
      <div className="h-14 border-b border-zinc-100 flex items-center px-4 shrink-0">
        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Components</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3 overflow-auto">
        {components.map((c) => (
          <DraggableComponent key={c.type} {...c} />
        ))}
      </div>
    </div>
  );
}
