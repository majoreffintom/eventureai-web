import { create } from 'zustand';

export type ComponentType =
  | 'button' | 'text' | 'image' | 'container'
  | 'hero_section' | 'card' | 'grid' | 'flex'
  | 'heading' | 'paragraph' | 'link' | 'icon'
  | 'navbar' | 'footer' | 'section' | 'divider'
  | 'badge' | 'list' | 'list_item' | 'avatar'
  | 'input' | 'textarea' | 'select' | 'form'
  | 'modal' | 'tooltip' | 'dropdown';

export interface EditorElement {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: EditorElement[];
}

interface EditorState {
  elements: EditorElement[];
  selectedElementId: string | null;
  addElement: (element: EditorElement, parentId?: string, index?: number) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, targetParentId: string | null, targetIndex?: number) => void;
  duplicateElement: (id: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedElementId: null,
  
  addElement: (element, parentId, index) => set((state) => {
    if (!parentId) {
      const newElements = [...state.elements];
      if (typeof index === 'number') {
        newElements.splice(index, 0, element);
      } else {
        newElements.push(element);
      }
      return { elements: newElements };
    }
    
    // Recursive function to add to children
    const addToChildren = (items: EditorElement[]): EditorElement[] => {
      return items.map(item => {
        if (item.id === parentId) {
          const newChildren = [...(item.children || [])];
          if (typeof index === 'number') {
            newChildren.splice(index, 0, element);
          } else {
            newChildren.push(element);
          }
          return { ...item, children: newChildren };
        }
        if (item.children) {
          return { ...item, children: addToChildren(item.children) };
        }
        return item;
      });
    };
    
    return { elements: addToChildren(state.elements) };
  }),
  
  removeElement: (id) => set((state) => {
    const removeFromChildren = (items: EditorElement[]): EditorElement[] => {
      return items.filter(item => item.id !== id).map(item => ({
        ...item,
        children: item.children ? removeFromChildren(item.children) : undefined
      }));
    };
    return { elements: removeFromChildren(state.elements) };
  }),
  
  updateElement: (id, updates) => set((state) => {
    const updateInChildren = (items: EditorElement[]): EditorElement[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children) {
          return { ...item, children: updateInChildren(item.children) };
        }
        return item;
      });
    };
    return { elements: updateInChildren(state.elements) };
  }),
  
  selectElement: (id) => set({ selectedElementId: id }),

  duplicateElement: (id) => set((state) => {
    let elementToDuplicate: EditorElement | null = null;
    let parentOfDuplicate: string | null = null;
    let indexOfDuplicate: number = -1;

    const findAndClone = (items: EditorElement[], parentId: string | null = null) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          elementToDuplicate = JSON.parse(JSON.stringify(items[i]));
          parentOfDuplicate = parentId;
          indexOfDuplicate = i;
          return;
        }
        if (items[i].children) findAndClone(items[i].children as EditorElement[], items[i].id);
      }
    };

    findAndClone(state.elements);

    if (elementToDuplicate !== null) {
      const elToDup = elementToDuplicate as EditorElement;
      const newId = `${elToDup.type}-${Date.now()}`;
      
      const cloneWithNewIds = (el: EditorElement): EditorElement => ({
        ...el,
        id: `${el.type}-${Math.random().toString(36).substr(2, 9)}`,
        children: el.children ? el.children.map(cloneWithNewIds) : undefined
      });

      const newElement = cloneWithNewIds(elToDup);
      newElement.id = newId; // Main ID from first line

      const addToChildren = (items: EditorElement[]): EditorElement[] => {
        if (!parentOfDuplicate) {
          const newItems = [...items];
          newItems.splice(indexOfDuplicate + 1, 0, newElement);
          return newItems;
        }
        return items.map(item => {
          if (item.id === parentOfDuplicate) {
            const newChildren = [...(item.children || [])];
            newChildren.splice(indexOfDuplicate + 1, 0, newElement);
            return { ...item, children: newChildren };
          }
          if (item.children) {
            return { ...item, children: addToChildren(item.children) };
          }
          return item;
        });
      };
      return { elements: addToChildren(state.elements) };
    }
    return state;
  }),

  moveElement: (id, targetParentId, targetIndex) => {
    const state = get();
    
    // 1. Find the element
    let elementToMove: EditorElement | null = null;
    const findElement = (items: EditorElement[]) => {
      for (const item of items) {
        if (item.id === id) {
          elementToMove = item;
          return;
        }
        if (item.children) findElement(item.children);
      }
    };
    findElement(state.elements);
    
    if (!elementToMove) return;

    // 2. Remove it from its current position
    // (We reuse the remove logic by just calculating the new tree)
    const removeFromChildren = (items: EditorElement[]): EditorElement[] => {
      return items.filter(item => item.id !== id).map(item => ({
        ...item,
        children: item.children ? removeFromChildren(item.children) : undefined
      }));
    };
    
    const treeWithoutElement = removeFromChildren(state.elements);

    // 3. Add it to the new position
    const addElementToTree = (items: EditorElement[], parentId: string | null): EditorElement[] => {
      if (!parentId) {
        const newItems = [...items];
        if (typeof targetIndex === 'number') {
          newItems.splice(targetIndex, 0, elementToMove!);
        } else {
          newItems.push(elementToMove!);
        }
        return newItems;
      }

      return items.map(item => {
        if (item.id === parentId) {
          const newChildren = [...(item.children || [])];
          if (typeof targetIndex === 'number') {
            newChildren.splice(targetIndex, 0, elementToMove!);
          } else {
            newChildren.push(elementToMove!);
          }
          return { ...item, children: newChildren };
        }
        if (item.children) {
          return { ...item, children: addElementToTree(item.children, parentId) };
        }
        return item;
      });
    };

    set({ elements: addElementToTree(treeWithoutElement, targetParentId) });
  }
}));

if (typeof window !== 'undefined') {
  const bc = new BroadcastChannel('builder-preview');
  useEditorStore.subscribe((state) => {
    bc.postMessage({ type: 'UPDATE_ELEMENTS', elements: state.elements });
    localStorage.setItem('builder-dev-preview', JSON.stringify(state.elements));
  });
}
