export const dsTokens = {
  light: {
    bg: {
      primary: "#FFFFFF",
      secondary: "#F3F4F6",
      tertiary: "#F8FAFC",
    },
    surface: {
      primary: "#FFFFFF",
      elevated: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      tertiary: "#64748B",
      inverse: "#FFFFFF",
    },
    border: {
      default: "#E5E7EB",
      subtle: "#EEF2F7",
    },
    brand: {
      primary: "#2563EB",
      hover: "#1D4ED8",
      active: "#1E40AF",
    },
    state: {
      danger: "#B91C1C",
      dangerBorder: "#FCA5A5",
    },
    glass: {
      bg: "rgba(255, 255, 255, 0.70)",
      border: "rgba(255, 255, 255, 0.35)",
      shadow: "rgba(0, 0, 0, 0.12)",
    },
  },
  dark: {
    bg: {
      primary: "#121212",
      secondary: "#0F172A",
      tertiary: "#111827",
    },
    surface: {
      primary: "#1E1E1E",
      elevated: "#1E293B",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#CBD5E1",
      tertiary: "#94A3B8",
      inverse: "#0F172A",
    },
    border: {
      default: "#334155",
      subtle: "#223047",
    },
    brand: {
      primary: "#3B82F6",
      hover: "#2563EB",
      active: "#1D4ED8",
    },
    state: {
      danger: "#F87171",
      dangerBorder: "rgba(248, 113, 113, 0.55)",
    },
    glass: {
      bg: "rgba(30, 41, 59, 0.65)",
      border: "rgba(255, 255, 255, 0.10)",
      shadow: "rgba(0, 0, 0, 0.50)",
    },
  },
};

export function themeToCssVars(theme) {
  const t = dsTokens[theme] || dsTokens.light;
  return {
    "--ds-bg-primary": t.bg.primary,
    "--ds-bg-secondary": t.bg.secondary,
    "--ds-bg-tertiary": t.bg.tertiary,
    "--ds-surface": t.surface.primary,
    "--ds-surface-elevated": t.surface.elevated,
    "--ds-text-primary": t.text.primary,
    "--ds-text-secondary": t.text.secondary,
    "--ds-text-tertiary": t.text.tertiary,
    "--ds-text-inverse": t.text.inverse,
    "--ds-border": t.border.default,
    "--ds-border-subtle": t.border.subtle,
    "--ds-brand": t.brand.primary,
    "--ds-brand-hover": t.brand.hover,
    "--ds-brand-active": t.brand.active,
    "--ds-danger": t.state.danger,
    "--ds-danger-border": t.state.dangerBorder,
    "--ds-glass-bg": t.glass.bg,
    "--ds-glass-border": t.glass.border,
    "--ds-glass-shadow": t.glass.shadow,
  };
}
