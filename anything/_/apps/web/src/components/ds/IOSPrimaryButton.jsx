"use client";

export default function IOSPrimaryButton({
  as = "a",
  className = "",
  style = {},
  children,
  ...props
}) {
  const Tag = as;

  return (
    <Tag
      className={`group inline-flex items-center justify-center w-full px-5 py-4 rounded-2xl font-semibold active:scale-[0.99] transition-transform ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,245,245,0.96) 100%)",
        color: "#0b0b0b",
        boxShadow:
          "0 16px 34px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.35) inset",
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
