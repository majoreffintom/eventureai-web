"use client";

import { useEditorStore, EditorElement } from "@/store/editorStore";
import { TextElement, ButtonElement, ImageElement, ContainerElement } from "./elements";
import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect, useRef } from "react";
import { Copy, Trash2, MoveUp, MoveDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

export function ComponentRenderer({ element }: { element: EditorElement }) {
  const { selectElement, selectedElementId, updateElement, removeElement, duplicateElement } = useEditorStore();
  const isSelected = selectedElementId === element.id;
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: element.id,
    data: { isNew: false, type: element.type },
    disabled: isResizing
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(element.id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Resize Logic
  const startResize = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const el = document.getElementById(element.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;

      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      
      updateElement(element.id, {
        props: {
          ...element.props,
          width: `${resizeRef.current.startWidth + deltaX}px`,
          height: `${resizeRef.current.startHeight + deltaY}px`
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, element.id, element.props, updateElement]);

  const renderContent = () => {
    // Safely parse style prop - ensure it's always an object
    const getStyle = (): React.CSSProperties => {
      const style = element.props?.style;
      if (!style) return {};
      if (typeof style === 'string') {
        try {
          return JSON.parse(style);
        } catch {
          return {};
        }
      }
      if (typeof style === 'object') return style;
      return {};
    };
    const style = getStyle();

    switch (element.type) {
      case 'text':
        return <TextElement id={element.id} props={element.props} />;
      case 'button':
        return <ButtonElement id={element.id} props={element.props} />;
      case 'image':
        return <ImageElement id={element.id} props={element.props} />;
      case 'container':
        return (
          <ContainerElement id={element.id} props={element.props}>
            {element.children?.map(child => (
              <ComponentRenderer key={child.id} element={child} />
            ))}
          </ContainerElement>
        );
      case 'hero_section':
        return (
          <div className="w-full py-20 px-8 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg text-center" style={style}>
            {element.props?.heading && (
              <h1 className="text-4xl font-bold text-pink-800 mb-4">{element.props.heading}</h1>
            )}
            {element.props?.subheading && (
              <p className="text-xl text-pink-600 mb-6">{element.props.subheading}</p>
            )}
            {element.props?.description && (
              <p className="text-pink-500 mb-8 max-w-2xl mx-auto">{element.props.description}</p>
            )}
            {element.props?.buttonText && (
              <button className="px-8 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-colors">
                {element.props.buttonText}
              </button>
            )}
            {element.props?.button_secondary_text && (
              <button className="ml-4 px-8 py-3 border-2 border-pink-500 text-pink-500 rounded-full font-semibold hover:bg-pink-50 transition-colors">
                {element.props.button_secondary_text}
              </button>
            )}
          </div>
        );
      case 'card':
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-sm" style={style}>
            {element.props?.imageUrl && (
              <img src={element.props.imageUrl} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              {element.props?.title && (
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{element.props.title}</h3>
              )}
              {element.props?.description && (
                <p className="text-gray-600">{element.props.description}</p>
              )}
              {element.props?.price && (
                <p className="text-2xl font-bold text-pink-500 mt-4">{element.props.price}</p>
              )}
              {element.props?.buttonText && (
                <button className="mt-4 w-full py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
                  {element.props.buttonText}
                </button>
              )}
            </div>
          </div>
        );
      case 'navbar':
        return (
          <nav className="w-full px-6 py-4 bg-white shadow-sm flex items-center justify-between" style={style}>
            {element.props?.logo && (
              <div className="text-xl font-bold text-pink-500">{element.props.logo}</div>
            )}
            <div className="flex gap-6">
              {element.props?.links?.map((link: string, i: number) => (
                <a key={i} href="#" className="text-gray-600 hover:text-pink-500">{link}</a>
              ))}
            </div>
          </nav>
        );
      case 'footer':
        return (
          <footer className="w-full px-6 py-8 bg-gray-900 text-gray-300" style={style}>
            {element.props?.text && <p>{element.props.text}</p>}
            {element.props?.copyright && <p className="text-sm mt-2">{element.props.copyright}</p>}
          </footer>
        );
      case 'section':
        return (
          <div className="w-full py-12 px-6" style={style}>
            {element.props?.title && <h2 className="text-2xl font-bold mb-4">{element.props.title}</h2>}
            {element.children?.map(child => (
              <ComponentRenderer key={child.id} element={child} />
            ))}
          </div>
        );
      case 'heading':
        const HeadingTag = (element.props?.level as keyof JSX.IntrinsicElements) || 'h2';
        return <HeadingTag className="text-2xl font-bold" style={style}>{element.props?.text || element.props?.content}</HeadingTag>;
      case 'paragraph':
        return <p className="text-gray-600" style={style}>{element.props?.text || element.props?.content}</p>;
      case 'grid':
        return (
          <div className="grid gap-4" style={{ gridTemplateColumns: element.props?.columns || 'repeat(3, 1fr)', ...style }}>
            {element.children?.map(child => (
              <ComponentRenderer key={child.id} element={child} />
            ))}
          </div>
        );
      case 'flex':
        return (
          <div className="flex gap-4" style={{ flexDirection: element.props?.direction || 'row', ...style }}>
            {element.children?.map(child => (
              <ComponentRenderer key={child.id} element={child} />
            ))}
          </div>
        );
      case 'divider':
        return <hr className="border-t border-gray-200 my-4" style={style} />;
      case 'badge':
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-pink-100 text-pink-800 rounded-full" style={style}>
            {element.props?.text || element.props?.label}
          </span>
        );
      default:
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
            {element.props?.text || element.props?.content || element.props?.label || `${element.type} component`}
          </div>
        );
    }
  };

  return (
    <div 
      id={element.id}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
      }}
      className={cn(
        "group transition-all",
        isSelected ? "ring-2 ring-indigo-500" : "hover:ring-1 hover:ring-indigo-500/30"
      )}
    >
      <ComponentErrorBoundary elementId={element.id}>
        {renderContent()}
      </ComponentErrorBoundary>

      {/* Resize Handle */}
      {isSelected && (
        <div 
          onMouseDown={(e) => startResize(e, 'se')}
          className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 cursor-nwse-resize z-50 rounded-full border-2 border-white shadow-sm"
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[1000] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { duplicateElement(element.id); setContextMenu(null); }}
            className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-indigo-500 hover:text-white flex items-center gap-2"
          >
            <Copy size={14} /> Duplicate
          </button>
          <div className="h-px bg-zinc-800 my-1" />
          <button 
            onClick={() => { removeElement(element.id); setContextMenu(null); }}
            className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
