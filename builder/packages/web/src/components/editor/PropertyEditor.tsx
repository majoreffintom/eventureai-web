"use client";

import { useEditorStore } from "@/store/editorStore";
import { X, Trash2 } from "lucide-react";

export function PropertyEditor() {
  const { selectedElementId, elements, updateElement, removeElement, selectElement } = useEditorStore();

  // Helper to find the selected element in the tree
  const findElement = (items: any[], id: string): any => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findElement(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedElement = selectedElementId ? findElement(elements, selectedElementId) : null;

  if (!selectedElement) {
    return (
      <div className="w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
          <X size={20} />
        </div>
        <p className="text-sm text-zinc-500">Select an element to edit its properties</p>
      </div>
    );
  }

  const handlePropChange = (key: string, value: any) => {
    updateElement(selectedElementId!, {
      props: { ...selectedElement.props, [key]: value }
    });
  };

  return (
    <div className="w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden shrink-0">
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
        <span className="text-sm font-medium">Properties</span>
        <button 
          onClick={() => selectElement(null)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Type</label>
          <div className="text-sm text-zinc-300 bg-zinc-800 px-3 py-2 rounded border border-zinc-700">
            {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">ID</label>
          <div className="text-[10px] font-mono text-zinc-500 truncate bg-zinc-950/50 p-1.5 rounded">
            {selectedElement.id}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Style</label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-zinc-400">BG Color</span>
              <input 
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                value={selectedElement.props.backgroundColor || ""}
                onChange={(e) => handlePropChange('backgroundColor', e.target.value)}
                placeholder="#000000"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-zinc-400">Color</span>
              <input 
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                value={selectedElement.props.color || ""}
                onChange={(e) => handlePropChange('color', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400">Padding</span>
            <input 
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
              value={selectedElement.props.padding || ""}
              onChange={(e) => handlePropChange('padding', e.target.value)}
              placeholder="1rem"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400">Border</span>
            <input 
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
              value={selectedElement.props.border || ""}
              onChange={(e) => handlePropChange('border', e.target.value)}
              placeholder="1px solid #ccc"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Content & Specifics</label>
          
          {selectedElement.type === 'text' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Content</span>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  value={selectedElement.props.text || ""}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-400">Font Size</span>
                  <input 
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                    value={selectedElement.props.fontSize || "16px"}
                    onChange={(e) => handlePropChange('fontSize', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-400">Weight</span>
                  <input 
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                    value={selectedElement.props.fontWeight || "normal"}
                    onChange={(e) => handlePropChange('fontWeight', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Font Family</span>
                <input 
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                  value={selectedElement.props.fontFamily || ""}
                  onChange={(e) => handlePropChange('fontFamily', e.target.value)}
                  placeholder="Playfair Display"
                />
              </div>
            </div>
          )}

          {selectedElement.type === 'button' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Label</span>
                <input 
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                  value={selectedElement.props.label || ""}
                  onChange={(e) => handlePropChange('label', e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedElement.type === 'image' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Source URL</span>
                <input 
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                  value={selectedElement.props.src || ""}
                  onChange={(e) => handlePropChange('src', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {selectedElement.type === 'container' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Direction</span>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                  value={selectedElement.props.direction || "column"}
                  onChange={(e) => handlePropChange('direction', e.target.value)}
                >
                  <option value="column">Column</option>
                  <option value="row">Row</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Justify</span>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-200"
                  value={selectedElement.props.justifyContent || "flex-start"}
                  onChange={(e) => handlePropChange('justifyContent', e.target.value)}
                >
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Between</option>
                  <option value="space-around">Around</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800 shrink-0">
        <button 
          onClick={() => {
            removeElement(selectedElement.id);
            selectElement(null);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded border border-red-400/20 transition-colors"
        >
          <Trash2 size={14} />
          Delete Element
        </button>
      </div>
    </div>
  );
}
