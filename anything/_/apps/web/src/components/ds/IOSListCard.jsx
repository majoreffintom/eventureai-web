"use client";

export default function IOSListCard({
  children,
  className = "",
  style = {},
  ...props
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.70)",
        border: "1px solid rgba(0,0,0,0.06)",
        WebkitBackdropFilter: "blur(16px)",
        backdropFilter: "blur(16px)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
