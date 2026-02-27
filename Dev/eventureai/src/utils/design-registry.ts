export type DesignConfig = {
  id: string;
  name: string;
  theme: 'light' | 'dark' | 'glass';
  primaryColor: string;
  borderRadius: string;
  glassOpacity: number;
  glassBlur: string;
  layout: 'centered' | 'split' | 'minimal';
  fontFamily: string;
};

export const DESIGNS: Record<number, DesignConfig> = {
  1: {
    id: "liquid-glass-original",
    name: "Liquid Glass Default",
    theme: 'glass',
    primaryColor: "#007AFF",
    borderRadius: "1.5rem",
    glassOpacity: 0.72,
    glassBlur: "18px",
    layout: 'centered',
    fontFamily: 'Inter'
  },
  2: {
    id: "dark-mode-pro",
    name: "Midnight Pro",
    theme: 'dark',
    primaryColor: "#0A84FF",
    borderRadius: "1rem",
    glassOpacity: 0.9,
    glassBlur: "25px",
    layout: 'split',
    fontFamily: 'Inter'
  },
  3: {
    id: "minimalist-clean",
    name: "Clean Slate",
    theme: 'light',
    primaryColor: "#1c1c1e",
    borderRadius: "0.5rem",
    glassOpacity: 1,
    glassBlur: "0px",
    layout: 'minimal',
    fontFamily: 'Inter'
  },
  // We can scale this to 55 easily by adding more configs here...
};

// Default fallback
export const DEFAULT_DESIGN = DESIGNS[1];
