"use client";

import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button, Link } from "./ds.jsx";
import useUser from "@/utils/useUser";

const COMPANY = {
  name: "Goldey's Heating & Cooling",
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
  email: "goldeyshvac@yahoo.com",
};

const LOGO = {
  url: "https://ucarecdn.com/416ac318-a7cf-4388-8d8c-6378c7ceb973/-/format/auto/",
  alt: "Goldey's Heating & Cooling",
};

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: user, loading: userLoading } = useUser();

  const authNavLink = useMemo(() => {
    if (userLoading) {
      return null;
    }
    if (user) {
      return { href: "/account/logout", label: "Sign out" };
    }
    return { href: "/account/signin", label: "Sign in" };
  }, [user, userLoading]);

  const links = useMemo(() => {
    const items = [
      { href: "/", label: "Home" },
      { href: "/schedule-maintenance", label: "Schedule Appointment" },
      { href: "/emergency", label: "Emergency Service" },
      { href: "/customer", label: "Customer Portal" },
    ];

    if (authNavLink) {
      items.push(authNavLink);
    }

    return items;
  }, [authNavLink]);

  return (
    <header className="bg-[var(--ds-surface)] border-b border-[var(--ds-border)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        {/* Mobile: keep logo centered with equal side columns. Desktop: keep the logo truly centered. */}
        <div className="grid grid-cols-[44px_1fr_44px] md:grid-cols-[1fr_auto_1fr] items-start gap-2">
          <div className="hidden md:flex flex-col gap-1 pt-1">
            <a
              href={COMPANY.phoneHref}
              className="text-sm font-semibold text-[var(--ds-text-primary)] hover:underline"
            >
              {COMPANY.phoneDisplay}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="text-sm font-semibold text-[var(--ds-text-primary)] hover:underline"
            >
              {COMPANY.email}
            </a>
          </div>

          {/* Mobile spacer to keep logo centered */}
          <div className="md:hidden" aria-hidden="true" />

          <div className="flex flex-col items-center text-center">
            <a
              href="/"
              className="inline-flex flex-col items-center gap-2 no-underline"
              aria-label={COMPANY.name}
            >
              <img
                src={LOGO.url}
                alt={LOGO.alt}
                className="h-12 w-[180px] md:h-[72px] md:w-[405px] object-contain"
                loading="eager"
              />
            </a>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setOpen(true)}
              variant="secondary"
              size="sm"
              iconOnly
              icon={Menu}
              aria-label="Open menu"
            />
          </div>
        </div>
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[320px] max-w-[85vw] bg-[var(--ds-surface)] border-l border-[var(--ds-border)] shadow-xl transition-transform duration-200 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-label="Site menu"
        >
          <div className="p-4 border-b border-[var(--ds-border-subtle)] flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--ds-text-primary)]">
              Menu
            </div>
            <Button
              onClick={() => setOpen(false)}
              variant="ghost"
              size="sm"
              iconOnly
              icon={X}
              aria-label="Close menu"
            />
          </div>

          <nav className="p-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-tertiary)] no-underline hover:no-underline"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t border-[var(--ds-border-subtle)] space-y-2">
            <a href={COMPANY.phoneHref} className="block">
              <Button className="w-full" variant="primary">
                Call {COMPANY.phoneDisplay}
              </Button>
            </a>
            <a href={`mailto:${COMPANY.email}`} className="block">
              <Button className="w-full" variant="secondary">
                Email {COMPANY.email}
              </Button>
            </a>
          </div>
        </aside>
      </div>
    </header>
  );
}
