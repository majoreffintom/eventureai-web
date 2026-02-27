"use client";

import { useEffect, useMemo } from "react";
import MarketingHeader from "@/components/Marketing/MarketingHeader";

const SERVICE_CONTENT = {
  blockchain: {
    title: "Blockchain",
    description:
      "Smart contracts, NFT / token flows, wallet sign-in (MetaMask), and on-chain audit trails so your app can prove what happened and when — including Polygon-based builds.",
  },
  finance: {
    title: "Finance",
    description:
      "We connect and automate your financial tools: Stripe + invoices/subscriptions, bookkeeping exports, dashboards, and integrations that keep your systems in sync.",
  },
  integration: {
    title: "Integration",
    description:
      "Connect your tools and data sources so your team isn’t copying and pasting all day.",
  },
  memory: {
    title: "Memory",
    description:
      "A structured AI memory system so your app can remember, search, and reuse what matters.",
  },
  "full-stack-web-dev": {
    title: "Full Stack Web Dev",
    description:
      "Full stack development means building the full product: the pages people use, the APIs behind them, and the database/auth that powers it — including adding new features inside existing software.",
  },
  seo: {
    title: "SEO",
    description:
      "Technical SEO cleanup, content structure, and site speed improvements that help you rank.",
  },
  marketing: {
    title: "Marketing",
    description:
      "Funnels, pages, messaging, and simple experiments that drive real leads.",
  },
  "business-consulting": {
    title: "Business Consulting",
    description:
      "Process, pricing, positioning, and execution support — with the tech to back it up.",
  },
};

function titleCaseFallback(slug) {
  if (!slug) return "Service";
  const cleaned = String(slug).replace(/-/g, " ");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function upsertMetaTag({ selector, create, set }) {
  if (typeof document === "undefined") return;
  const existing = document.head.querySelector(selector);
  const el = existing || create();
  set(el);
  if (!existing) {
    document.head.appendChild(el);
  }
}

export default function ServicePage({ params }) {
  const slug = params?.slug;
  const content = SERVICE_CONTENT[slug] || null;

  const title = content?.title || titleCaseFallback(slug);
  const description =
    content?.description ||
    "This page is being set up. If you tell me what you want here, I’ll shape it around your offer.";

  const seo = useMemo(() => {
    const seoTitle = `${title} | EventureAI`;

    let url = null;
    if (typeof window !== "undefined") {
      url = window.location.href;
    }

    return {
      title: seoTitle,
      description,
      url,
    };
  }, [title, description]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = seo.title;

    upsertMetaTag({
      selector: 'meta[name="description"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "description");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.description),
    });

    upsertMetaTag({
      selector: 'meta[name="robots"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "robots");
        return el;
      },
      set: (el) => el.setAttribute("content", "index,follow"),
    });

    upsertMetaTag({
      selector: 'meta[property="og:title"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("property", "og:title");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.title),
    });

    upsertMetaTag({
      selector: 'meta[property="og:description"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("property", "og:description");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.description),
    });

    upsertMetaTag({
      selector: 'meta[property="og:type"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("property", "og:type");
        return el;
      },
      set: (el) => el.setAttribute("content", "website"),
    });

    if (seo.url) {
      upsertMetaTag({
        selector: 'meta[property="og:url"]',
        create: () => {
          const el = document.createElement("meta");
          el.setAttribute("property", "og:url");
          return el;
        },
        set: (el) => el.setAttribute("content", seo.url),
      });

      upsertMetaTag({
        selector: 'link[rel="canonical"]',
        create: () => {
          const el = document.createElement("link");
          el.setAttribute("rel", "canonical");
          return el;
        },
        set: (el) => el.setAttribute("href", seo.url),
      });
    }

    upsertMetaTag({
      selector: 'meta[name="twitter:card"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "twitter:card");
        return el;
      },
      set: (el) => el.setAttribute("content", "summary"),
    });

    upsertMetaTag({
      selector: 'meta[name="twitter:title"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "twitter:title");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.title),
    });

    upsertMetaTag({
      selector: 'meta[name="twitter:description"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "twitter:description");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.description),
    });
  }, [seo]);

  return (
    <div
      className="min-h-screen text-black"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <MarketingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="rounded-3xl p-6 sm:p-8"
          style={{
            backgroundColor: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(0,0,0,0.06)",
            WebkitBackdropFilter: "blur(18px)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.06)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl tracking-wide font-semibold">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-black/70 max-w-[62ch]">
            {description}
          </p>

          <div className="mt-8 border-t border-black/10 pt-6">
            <div className="text-sm text-black/70">
              Want this page to do something specific?
            </div>
            <ul className="mt-3 list-disc pl-5 text-sm text-black/70 space-y-1">
              <li>Explain the offer</li>
              <li>Show pricing tiers</li>
              <li>Collect leads (name/email)</li>
              <li>Book a call</li>
            </ul>
          </div>

          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 rounded-2xl active:scale-[0.99] transition-transform"
              style={{
                backgroundColor: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
