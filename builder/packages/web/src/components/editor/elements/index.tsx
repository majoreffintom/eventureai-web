"use client";

import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

export function TextElement({ id, props }: { id: string; props: any }) {
// ... text element ...

  const { selectedElementId } = useEditorStore();
  const isSelected = selectedElementId === id;

  return (
    <div 
      className={cn(
        "p-2 rounded hover:ring-1 hover:ring-indigo-500/50 transition-all",
        isSelected && "ring-2 ring-indigo-500 hover:ring-indigo-500"
      )}
    >
      <p 
        style={{ 
          fontSize: props.fontSize || '16px',
          fontWeight: props.fontWeight || 'normal',
          color: props.color || 'inherit',
          textAlign: props.textAlign || 'left',
          fontFamily: props.fontFamily,
          letterSpacing: props.letterSpacing,
          lineHeight: props.lineHeight,
          textTransform: props.textTransform
        }}
      >
        {props.text || "Double click to edit text"}
      </p>
    </div>
  );
}

export function ButtonElement({ id, props }: { id: string; props: any }) {
  const { selectedElementId } = useEditorStore();
  const isSelected = selectedElementId === id;

  return (
    <div 
      className={cn(
        "p-2 inline-block rounded hover:ring-1 hover:ring-indigo-500/50 transition-all",
        isSelected && "ring-2 ring-indigo-500 hover:ring-indigo-500"
      )}
    >
      <button 
        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-medium transition-colors"
        style={{
          backgroundColor: props.backgroundColor,
          color: props.color,
          borderRadius: props.borderRadius,
          padding: props.padding,
          fontSize: props.fontSize,
          border: props.border
        }}
      >
        {props.label || "Click me"}
      </button>
    </div>
  );
}

export function ImageElement({ id, props }: { id: string; props: any }) {
  const { selectedElementId } = useEditorStore();
  const isSelected = selectedElementId === id;

  return (
    <div 
      className={cn(
        "p-2 inline-block rounded hover:ring-1 hover:ring-indigo-500/50 transition-all",
        isSelected && "ring-2 ring-indigo-500 hover:ring-indigo-500"
      )}
    >
      {props.src ? (
        <img 
          src={props.src} 
          alt={props.alt || ""} 
          className="max-w-full h-auto rounded-lg"
          style={{ 
            width: props.width, 
            height: props.height,
            objectFit: props.objectFit || 'cover',
            borderRadius: props.borderRadius
          }}
        />
      ) : (
        <div className="w-48 h-32 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-700">
          Image Placeholder
        </div>
      )}
    </div>
  );
}

export function ContainerElement({ id, props, children }: { id: string; props: any; children?: React.ReactNode }) {
  const { selectedElementId } = useEditorStore();
  const isSelected = selectedElementId === id;

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${id}`,
    data: { type: 'container' }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-4 min-h-[50px] rounded-xl transition-all",
        isSelected && "ring-2 ring-indigo-500 hover:ring-indigo-500",
        isOver && "ring-2 ring-emerald-500 bg-emerald-500/5",
        !props.backgroundColor && !props.border && !isOver && "border border-zinc-800 bg-zinc-900/50"
      )}
      style={{
        display: 'flex',
        flexDirection: props.direction || 'column',
        alignItems: props.alignItems || 'stretch',
        justifyContent: props.justifyContent || 'flex-start',
        padding: props.padding,
        margin: props.margin,
        backgroundColor: props.backgroundColor,
        width: props.width || '100%',
        height: props.height,
        border: props.border,
        borderBottom: props.borderBottom,
        borderRadius: props.borderRadius,
        position: props.position || 'relative',
        top: props.top,
        left: props.left,
        right: props.right,
        bottom: props.bottom,
        zIndex: props.zIndex,
        backdropFilter: props.backdropFilter,
        gap: props.gap || '1rem',
        flexWrap: props.flexWrap || 'nowrap'
      }}
    >
      {children || <div className="text-zinc-600 italic text-sm text-center py-4">Container</div>}
    </div>
  );
}
