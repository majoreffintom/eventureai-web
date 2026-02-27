export default function DSText({
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
  };

  const sizeCls = sizes[size] || sizes.base;
  const toneCls = tones[tone] || tones.secondary;

  return (
    <Tag className={`font-inter ${sizeCls} ${toneCls} ${className}`}>
      {children}
    </Tag>
  );
}
