export default function DSHeading({ level = 1, children, className = "" }) {
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
