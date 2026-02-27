export default function DSGlass({ children, className = "" }) {
  return (
    <div
      className={`backdrop-blur-xl bg-[var(--ds-glass-bg)] border border-[var(--ds-glass-border)] shadow-[0_8px_32px_var(--ds-glass-shadow)] rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}
