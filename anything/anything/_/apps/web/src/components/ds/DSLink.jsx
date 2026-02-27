export default function DSLink({ href, children, className = "", ...props }) {
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
