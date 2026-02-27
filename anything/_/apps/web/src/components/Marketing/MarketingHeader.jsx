"use client";

import { useCallback, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Memory Tournament", href: "/tournament" },
];

const SERVICE_ITEMS = [
  { label: "Blockchain", href: "/services/blockchain" },
  { label: "Finance", href: "/services/finance" },
  { label: "Integration", href: "/services/integration" },
  { label: "Memory", href: "/services/memory" },
  { label: "Full Stack Web Dev", href: "/services/full-stack-web-dev" },
  { label: "SEO", href: "/services/seo" },
  { label: "Marketing", href: "/services/marketing" },
  { label: "Business Consulting", href: "/services/business-consulting" },
];

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const ariaLabel = open ? "Close menu" : "Open menu";

  const menuItems = useMemo(() => {
    const seen = new Set();
    const out = [];

    const add = (item) => {
      if (!item?.href || seen.has(item.href)) return;
      seen.add(item.href);
      out.push(item);
    };

    NAV_ITEMS.forEach(add);
    SERVICE_ITEMS.forEach(add);

    return out;
  }, []);

  return (
    <>
      {/* iOS-like dim + blur backdrop when menu is open */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="fixed inset-0 z-40 w-full h-full bg-black/25 backdrop-blur-sm"
        />
      ) : null}

      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          WebkitBackdropFilter: "blur(18px)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 items-center">
          <div />

          <a
            href="/"
            className="justify-self-center text-lg sm:text-xl tracking-wide"
            onClick={close}
          >
            EventureAI
          </a>

          <button
            type="button"
            className="justify-self-end inline-flex items-center justify-center h-10 w-10 rounded-full active:scale-95 transition-transform"
            style={{
              backgroundColor: "rgba(255,255,255,0.70)",
              border: "1px solid rgba(0,0,0,0.10)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 20px rgba(0,0,0,0.06)",
            }}
            onClick={toggle}
            aria-label={ariaLabel}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open ? (
          <div
            className="relative z-50"
            style={{
              backgroundColor: "rgba(255,255,255,0.82)",
              WebkitBackdropFilter: "blur(22px)",
              backdropFilter: "blur(22px)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
              {menuItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="px-3 py-3 rounded-2xl text-base tracking-wide active:bg-black/5"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}
