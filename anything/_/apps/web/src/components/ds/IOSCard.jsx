"use client";

export default function IOSCard({
  children,
  className = "",
  style = {},
  ...props
}) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(0,0,0,0.06)",
        WebkitBackdropFilter: "blur(18px)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.06)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
