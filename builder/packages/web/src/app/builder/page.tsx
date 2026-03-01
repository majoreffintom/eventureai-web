"use client";

import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { Sidebar } from "@/components/layout/Sidebar";
import { Palette } from "@/components/editor/Palette";
import { Canvas } from "@/components/editor/Canvas";
import { AIPanel } from "@/components/chat/AIPanel";
import { PropertyEditor } from "@/components/editor/PropertyEditor";
import { useEditorStore } from "@/store/editorStore";
import { useState } from "react";
import { Type, SquareSquare, Image as ImageIcon, BoxSelect } from "lucide-react";

export default function Home() {
  const { addElement, moveElement } = useEditorStore();
  const [activeDragData, setActiveDragData] = useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    if (!over) return;

    const isNew = active.data.current?.isNew;
    const type = active.data.current?.type;
    const activeId = active.id as string;
    
    // Determine the target container ID (null means root canvas)
    const targetId = over.id === "canvas-root" ? null : (over.id as string).replace('drop-', '');

    if (isNew && type) {
      // Adding a completely new element from the palette
      addElement({
        id: `${type}-${Date.now()}`,
        type,
        props: {},
        children: type === 'container' ? [] : undefined
      }, targetId || undefined);
    } else if (!isNew) {
      // Moving an existing element on the canvas
      moveElement(activeId, targetId);
    }
  };

  const renderDragOverlay = () => {
    if (!activeDragData) return null;
    
    const { type, isNew } = activeDragData;
    
    if (isNew) {
      const getIcon = () => {
        if (type === 'text') return <Type size={20} className="text-zinc-400" />;
        if (type === 'button') return <SquareSquare size={20} className="text-zinc-400" />;
        if (type === 'image') return <ImageIcon size={20} className="text-zinc-400" />;
        return <BoxSelect size={20} className="text-zinc-400" />;
      };

      return (
        <div className="p-3 w-24 rounded-xl border border-indigo-500/50 bg-zinc-800 shadow-xl flex flex-col items-center justify-center gap-2 opacity-80 cursor-grabbing">
          {getIcon()}
          <span className="text-xs font-medium text-zinc-300 capitalize">{type}</span>
        </div>
      );
    }

    // Moving existing component overlay
    return (
      <div className="p-2 border border-indigo-500 bg-zinc-800/80 backdrop-blur-sm rounded shadow-xl text-zinc-300 text-xs truncate max-w-[200px] cursor-grabbing">
        Moving {type}...
      </div>
    );
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <main className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-50">
        <Sidebar />
        <Palette />
        <Canvas />
        <PropertyEditor />
        <AIPanel />
      </main>
      <DragOverlay dropAnimation={null}>
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
}
