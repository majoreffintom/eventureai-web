"use client";

import { Link, Text } from "./ds.jsx";

const COMPANY = {
  name: "Goldey's Heating & Cooling",
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
  email: "goldeyshvac@yahoo.com",
  addressLines: ["728 Frankfort Road", "Shelbyville, KY 40065"],
};

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--ds-surface)] border-t border-[var(--ds-border)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Text as="div" tone="primary" className="font-bold">
              Contact
            </Text>
            <Text size="sm" tone="tertiary" className="mt-2">
              <a
                href={COMPANY.phoneHref}
                className="hover:text-[var(--ds-text-primary)]"
              >
                {COMPANY.phoneDisplay}
              </a>
            </Text>
            <Text size="sm" tone="tertiary" className="mt-1">
              <a
                href={`mailto:${COMPANY.email}`}
                className="hover:text-[var(--ds-text-primary)]"
              >
                {COMPANY.email}
              </a>
            </Text>
            <div className="mt-3 text-sm text-[var(--ds-text-tertiary)]">
              <div>{COMPANY.addressLines[0]}</div>
              <div>{COMPANY.addressLines[1]}</div>
            </div>
          </div>

          <div>
            <Text as="div" tone="primary" className="font-bold">
              Pages
            </Text>
            <div className="mt-2">
              <Link href="/" className="block text-sm">
                Home
              </Link>
              <Link href="/request-quote" className="mt-2 block text-sm">
                Request a quote
              </Link>
              <Link href="/schedule-maintenance" className="mt-2 block text-sm">
                Schedule maintenance
              </Link>
              <Link href="/emergency" className="mt-2 block text-sm">
                Emergency & after hours
              </Link>
              <Link href="/customer" className="mt-2 block text-sm">
                Customer portal
              </Link>
              <Link href="/about" className="mt-2 block text-sm">
                About us
              </Link>

              {/* Admin entry point (intentionally subtle) */}
              <Link href="/admin/login" className="mt-4 block text-sm">
                Admin
              </Link>
            </div>
          </div>

          <div>
            <Text as="div" tone="primary" className="font-bold">
              Hours
            </Text>
            <Text size="sm" tone="tertiary" className="mt-2">
              Mon–Fri: 8am–5pm
            </Text>
            <Text size="sm" tone="tertiary" className="mt-1">
              Emergency: 24/7
            </Text>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--ds-border-subtle)] text-center">
          <Text size="xs" tone="tertiary">
            © 2026 {COMPANY.name}
          </Text>
        </div>
      </div>
    </footer>
  );
}
