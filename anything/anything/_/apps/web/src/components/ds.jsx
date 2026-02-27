"use client";

import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";
import { useTheme } from "../utils/theme.jsx";

export function Page({
  children,
  title,
  subtitle,
  header,
  footer,
  maxWidthClassName = "max-w-6xl",
  contentClassName = "",
  className = "",
}) {
  return (
    <div
      className={`min-h-screen bg-[var(--ds-bg-secondary)] text-[var(--ds-text-primary)] ${className}`}
    >
      {header}

      <main
        className={`mx-auto w-full ${maxWidthClassName} px-4 py-6 md:py-10 ${contentClassName}`}
      >
        {title ? (
          <div className="mb-6">
            <Heading level={1}>{title}</Heading>
            {subtitle ? (
              <Text className="mt-2" tone="secondary">
                {subtitle}
              </Text>
            ) : null}
          </div>
        ) : null}

        {children}
      </main>

      {footer}
    </div>
  );
}

export function Heading({ level = 1, children, className = "" }) {
  const Tag = `h${level}`;

  const sizes = {
    1: "text-2xl md:text-4xl font-bold",
    2: "text-xl md:text-2xl font-bold",
    3: "text-lg md:text-xl font-semibold",
    4: "text-base font-semibold",
  };

  const cls = sizes[level] || sizes[2];

  return (
    <Tag
      className={`font-inter text-[var(--ds-text-primary)] tracking-tight ${cls} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Text({
  as = "p",
  children,
  size = "base",
  tone = "secondary",
  className = "",
}) {
  const Tag = as;

  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  const tones = {
    primary: "text-[var(--ds-text-primary)]",
    secondary: "text-[var(--ds-text-secondary)]",
    tertiary: "text-[var(--ds-text-tertiary)]",
    danger: "text-[var(--ds-danger)]",
    inverse: "text-[var(--ds-text-inverse)]",
  };

  const sizeCls = sizes[size] || sizes.base;
  const toneCls = tones[tone] || tones.secondary;

  return (
    <Tag className={`font-inter ${sizeCls} ${toneCls} ${className}`}>
      {children}
    </Tag>
  );
}

export function Link({ href, children, className = "", ...props }) {
  return (
    <a
      href={href}
      className={`font-inter text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] underline-offset-4 hover:underline ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}

export function Glass({ children, className = "" }) {
  return (
    <div
      className={`backdrop-blur-xl bg-[var(--ds-glass-bg)] border border-[var(--ds-glass-border)] shadow-[0_8px_32px_var(--ds-glass-shadow)] rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  as = "button",
  href,
  onClick,
  type = "button",
  disabled,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconOnly = false,
  children,
  className = "",
  ...props
}) {
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };
  const iconOnlySizes = {
    sm: "h-9 w-9 p-0",
    md: "h-11 w-11 p-0",
    lg: "h-12 w-12 p-0",
  };

  const variants = {
    primary:
      "bg-gradient-to-b from-[var(--ds-text-primary)] to-[#0B1220] text-white",
    secondary:
      "bg-[var(--ds-surface)] border border-[var(--ds-border)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-tertiary)]",
    ghost:
      "bg-transparent text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-tertiary)]",
    glass:
      "backdrop-blur-xl bg-[var(--ds-glass-bg)] border border-[var(--ds-glass-border)] text-[var(--ds-text-primary)]",
    danger: "bg-[var(--ds-danger)] text-white hover:opacity-95",
  };

  const sizeCls = iconOnly
    ? iconOnlySizes[size] || iconOnlySizes.md
    : sizes[size] || sizes.md;
  const variantCls = variants[variant] || variants.primary;

  const base = `rounded-full font-inter font-semibold inline-flex items-center justify-center gap-2 transition-colors ${sizeCls} ${variantCls} disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  if (as === "a" || href) {
    return (
      <a
        href={href}
        className={`${base} no-underline hover:no-underline`}
        {...props}
      >
        {Icon ? <Icon size={16} /> : null}
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      {...props}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  glass = false,
  className = "",
}) {
  const shell = glass
    ? "backdrop-blur-xl bg-[var(--ds-glass-bg)] border border-[var(--ds-glass-border)] shadow-[0_8px_32px_var(--ds-glass-shadow)]"
    : "bg-[var(--ds-surface)] border border-[var(--ds-border)]";

  return (
    <div className={`rounded-2xl ${shell} ${className}`}>
      {title || right ? (
        <div className="px-4 md:px-6 py-4 border-b border-[var(--ds-border-subtle)] flex items-start justify-between gap-3">
          <div>
            {title ? <Heading level={2}>{title}</Heading> : null}
            {subtitle ? (
              <Text size="sm" tone="tertiary" className="mt-1">
                {subtitle}
              </Text>
            ) : null}
          </div>
          {right}
        </div>
      ) : null}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className = "",
  inputClassName = "",
  ...props
}) {
  const input = (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      className={`h-11 w-full px-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-brand)] focus:ring-offset-2 focus:ring-offset-[var(--ds-bg-secondary)] disabled:opacity-50 ${inputClassName}`}
      {...props}
    />
  );

  if (!label) {
    return <div className={className}>{input}</div>;
  }

  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-semibold text-[var(--ds-text-tertiary)]">
        {label}
      </div>
      <div className="mt-2">{input}</div>
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  className = "",
  selectClassName = "",
  ...props
}) {
  const renderedOptions = (options || []).map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ));

  const select = (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`h-11 w-full px-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-brand)] focus:ring-offset-2 focus:ring-offset-[var(--ds-bg-secondary)] disabled:opacity-50 ${selectClassName}`}
      {...props}
    >
      {renderedOptions}
    </select>
  );

  if (!label) {
    return <div className={className}>{select}</div>;
  }

  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-semibold text-[var(--ds-text-tertiary)]">
        {label}
      </div>
      <div className="mt-2">{select}</div>
    </label>
  );
}

export function Table({ columns, rows, className = "" }) {
  const safeColumns = columns || [];
  const safeRows = rows || [];

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {safeColumns.map((c) => (
              <th
                key={c.key}
                className="text-left text-xs font-semibold text-[var(--ds-text-tertiary)] px-3 py-2 border-b border-[var(--ds-border-subtle)]"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((r, idx) => (
            <tr key={r.id || idx}>
              {safeColumns.map((c) => {
                const val = r[c.key];
                const content = c.render ? c.render(r) : val;
                return (
                  <td
                    key={c.key}
                    className="px-3 py-3 text-sm text-[var(--ds-text-secondary)] border-b border-[var(--ds-border-subtle)]"
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs({ tabs, activeId, onChange, className = "" }) {
  const items = tabs || [];

  return (
    <div
      className={`rounded-2xl bg-[var(--ds-surface)] border border-[var(--ds-border)] overflow-x-auto ${className}`}
    >
      <div className="px-4">
        <div className="flex items-center gap-8">
          {items.map((t) => {
            const active = activeId === t.id;
            const Icon = t.icon;
            const activeClasses =
              "border-b-2 border-[var(--ds-brand)] text-[var(--ds-brand)]";
            const inactiveClasses =
              "border-b-2 border-transparent text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] hover:border-[var(--ds-border)]";
            const cls = active ? activeClasses : inactiveClasses;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange?.(t.id)}
                className={`flex items-center gap-2 px-1 py-4 text-sm font-semibold transition-colors ${cls}`}
              >
                {Icon ? <Icon size={16} /> : null}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ThemeModeSelect({ className = "" }) {
  const { mode, setMode } = useTheme();

  const options = useMemo(
    () => [
      { value: "system", label: "System" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
    [],
  );

  return (
    <Select
      className={className}
      label="Appearance"
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      options={options}
    />
  );
}

export function ThemeToggle({ variant = "ghost" }) {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Light" : "Dark";

  return (
    <Button
      onClick={toggleTheme}
      variant={variant}
      size="sm"
      icon={Icon}
      aria-label={`Switch to ${label} mode`}
    >
      {label}
    </Button>
  );
}
