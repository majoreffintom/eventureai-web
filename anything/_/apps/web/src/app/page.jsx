"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import MarketingHeader from "@/components/Marketing/MarketingHeader";
import {
  IOSCard,
  IOSListCard,
  IOSPrimaryButton,
} from "@/components/ds/index.js";

function upsertMetaTag({ selector, create, set }) {
  if (typeof document === "undefined") return;
  const existing = document.head.querySelector(selector);
  const el = existing || create();
  set(el);
  if (!existing) {
    document.head.appendChild(el);
  }
}

const LOGO_IMAGE_URL =
  "https://ucarecdn.com/1e36bcdc-49c5-4d7a-b459-f8951a750071/-/format/auto/";

const SPOKE_LINKS = [
  { slug: "blockchain", label: "Blockchain", href: "/services/blockchain" },
  { slug: "finance", label: "Finance", href: "/services/finance" },
  { slug: "integration", label: "Integration", href: "/services/integration" },
  { slug: "memory", label: "Memory", href: "/services/memory" },
  {
    slug: "full-stack-web-dev",
    label: "Full Stack Web Dev",
    href: "/services/full-stack-web-dev",
  },
  { slug: "seo", label: "SEO", href: "/services/seo" },
  { slug: "marketing", label: "Marketing", href: "/services/marketing" },
  {
    slug: "business-consulting",
    label: "Business Consulting",
    href: "/services/business-consulting",
  },
];

const SERVICE_CONTENT = {
  blockchain: {
    title: "Blockchain",
    teaser:
      "Smart contracts, token flows, wallet sign-in, and on-chain audit trails.",
    details:
      "We build real blockchain features that make your app provable and trustworthy: smart contracts, token / NFT flows, wallet sign-in (MetaMask), and on-chain audit trails so your app can prove what happened and when. We can design Polygon-based builds, transaction histories, and verifiable records that support compliance, transparency, and user trust.",
    bullets: [
      "Smart contracts + token/NFT flows",
      "Wallet sign-in (MetaMask) and user journeys",
      "Audit trails: prove what happened + when",
      "Polygon-based builds and integrations",
    ],
  },
  finance: {
    title: "Finance",
    teaser:
      "Stripe, invoices/subscriptions, dashboards, automation, and clean exports.",
    details:
      "CPA-led finance systems that actually ship. We wire up Stripe for subscriptions and one-time payments, automate invoices, build dashboards, and create exports that match real bookkeeping and tax workflows. The goal: accurate records, fewer manual steps, and a system you can trust month after month.",
    bullets: [
      "Stripe subscriptions + payments",
      "Invoices + receipts",
      "Dashboards + reporting",
      "Bookkeeping-friendly exports",
    ],
  },
  integration: {
    title: "Integration",
    teaser: "Connect your tools so data moves without copy/paste.",
    details:
      "We connect tools and data sources so your team isn't stuck copying and pasting all day. That can mean webhooks, API integrations, middleware, automation, and syncing data between your CRM, email platform, payments, analytics, and internal database — reliably.",
    bullets: [
      "APIs + webhooks",
      "Automation + sync",
      "Clean data flow between tools",
      "Less manual work for your team",
    ],
  },
  memory: {
    title: "Memory",
    teaser:
      "Structured AI memory so your app can remember and reuse what matters.",
    details:
      "We build structured AI memory so your app can remember, search, and reuse what matters. Instead of losing context, your assistant can reference past conversations, documents, and key decisions — so users get better answers and you avoid repeating the same intake questions.",
    bullets: [
      "Searchable memory",
      "Better follow-ups",
      "Less repetition",
      "Safer long-term context",
    ],
  },
  "full-stack-web-dev": {
    title: "Full Stack Web Dev",
    teaser: "End-to-end build: UI, APIs, database, deployment.",
    details:
      "Full stack means end-to-end delivery: the pages people use, the APIs behind them, and the database systems that keep it reliable. We can also add features inside existing apps. The focus is simple: ship stable software that works on mobile and desktop, and can grow with your business.",
    bullets: [
      "React pages people use",
      "Backend APIs",
      "Database design",
      "Production shipping + maintenance",
    ],
  },
  seo: {
    title: "SEO",
    teaser: "Technical SEO and site structure that compounds.",
    details:
      "Technical SEO cleanup, content structure, and site speed improvements that help you rank. We focus on the stuff Google actually rewards: clean structure, fast load, proper headings, schema markup, internal linking, and making sure your pages clearly explain who you help and what you do.",
    bullets: [
      "Core Web Vitals + site speed",
      "Schema markup",
      "Internal linking + structure",
      "Content systems that scale",
    ],
  },
  marketing: {
    title: "Marketing",
    teaser: "Pages, funnels, experiments, and tracking that drives leads.",
    details:
      "Funnels, landing pages, messaging, and simple experiments that drive real leads. We write clear copy, build fast pages, and set up tracking so you can see what works. No fluff — just the work that turns attention into action.",
    bullets: [
      "Landing pages + funnels",
      "Copy + positioning",
      "Tracking + measurement",
      "Iteration that improves results",
    ],
  },
  "business-consulting": {
    title: "Business Consulting",
    teaser: "Offer clarity, pricing, process, and execution with tech support.",
    details:
      "Process, pricing, positioning, and execution support — with the tech to back it up. If you need clear decisions, an operating plan, and the software/automation to execute it, we can help you get focused and moving.",
    bullets: [
      "Offer + positioning clarity",
      "Pricing + packaging",
      "Systems + execution",
      "Tech to support the plan",
    ],
  },
};

export default function MarketingHomePage() {
  const [pageUrl, setPageUrl] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const selectedContent = selectedService
    ? SERVICE_CONTENT[selectedService]
    : null;
  const learnMoreHref = selectedService ? `/services/${selectedService}` : null;

  // Native-ish swipe-to-close (drag right) for the slide-in panel
  const dragStartXRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetDrag = () => {
    dragStartXRef.current = null;
    setIsDragging(false);
    setDragX(0);
  };

  const onDragStart = (e) => {
    if (!selectedContent) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    dragStartXRef.current = touch.clientX;
    setIsDragging(true);
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const startX = dragStartXRef.current;
    if (typeof startX !== "number") return;
    const dx = Math.max(0, touch.clientX - startX);
    setDragX(dx);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    const shouldClose = dragX > 110;
    if (shouldClose) {
      setSelectedService(null);
    }
    resetDrag();
  };

  const seo = useMemo(() => {
    const title =
      "EventureAI | CPA-led AI, Blockchain, Full Stack Development & SEO";
    const description =
      "Built by a 25-year CPA and systems architect. We build practical AI + automation, blockchain and digital asset systems, full stack web apps, and technical SEO that compounds.";

    return {
      title,
      description,
      image: LOGO_IMAGE_URL,
    };
  }, []);

  const structuredDataJson = useMemo(() => {
    const canonicalUrl = pageUrl || "https://eventureai.com/";

    const json = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: "EventureAI",
          url: canonicalUrl,
          logo: seo.image,
          description: seo.description,
          sameAs: [],
        },
        {
          "@type": "WebSite",
          name: "EventureAI",
          url: canonicalUrl,
        },
        {
          "@type": "WebPage",
          name: seo.title,
          url: canonicalUrl,
          description: seo.description,
        },
      ],
    };

    return JSON.stringify(json);
  }, [pageUrl, seo.description, seo.image, seo.title]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }

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

    upsertMetaTag({
      selector: 'meta[property="og:image"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("property", "og:image");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.image),
    });

    upsertMetaTag({
      selector: 'meta[property="og:site_name"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("property", "og:site_name");
        return el;
      },
      set: (el) => el.setAttribute("content", "EventureAI"),
    });

    if (pageUrl) {
      upsertMetaTag({
        selector: 'meta[property="og:url"]',
        create: () => {
          const el = document.createElement("meta");
          el.setAttribute("property", "og:url");
          return el;
        },
        set: (el) => el.setAttribute("content", pageUrl),
      });

      upsertMetaTag({
        selector: 'link[rel="canonical"]',
        create: () => {
          const el = document.createElement("link");
          el.setAttribute("rel", "canonical");
          return el;
        },
        set: (el) => el.setAttribute("href", pageUrl),
      });
    }

    upsertMetaTag({
      selector: 'meta[name="twitter:card"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "twitter:card");
        return el;
      },
      set: (el) => el.setAttribute("content", "summary_large_image"),
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

    upsertMetaTag({
      selector: 'meta[name="twitter:image"]',
      create: () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "twitter:image");
        return el;
      },
      set: (el) => el.setAttribute("content", seo.image),
    });
  }, [pageUrl, seo.description, seo.image, seo.title]);

  // Lock background scroll for native-app feel
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!selectedContent) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedContent]);

  // Escape-to-close
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedContent) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedService(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedContent]);

  const backdropOpacity = 1 - Math.min(1, dragX / 320);

  return (
    <div
      className="text-black min-h-screen"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <script type="application/ld+json">{structuredDataJson}</script>

      <MarketingHeader />

      {/* Apple-style liquid glass overlay (stays on the homepage) */}
      {selectedContent ? (
        <>
          {/* Backdrop with blur (tap to close) */}
          <button
            type="button"
            aria-label="Close overlay"
            onClick={() => setSelectedService(null)}
            className="fixed inset-0 z-40 w-full h-full backdrop-blur-md"
            style={{ backgroundColor: `rgba(0,0,0,${0.45 * backdropOpacity})` }}
          />

          {/* Slide-in panel (swipe right to close) */}
          <div
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] text-white"
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
            onTouchCancel={onDragEnd}
            style={{
              background:
                "linear-gradient(135deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.90) 45%, rgba(10,10,10,0.96) 100%)",
              boxShadow: "-30px 0 60px rgba(0,0,0,0.45)",
              borderLeft: "1px solid rgba(255,255,255,0.10)",
              transform: `translateX(${dragX}px)`,
              transition: isDragging
                ? "none"
                : "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
              animation: isDragging
                ? "none"
                : "eventureSlideInRight 520ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            {/* Frosted top bar */}
            <div
              className="sticky top-0 z-10 px-4 sm:px-6 py-4"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                WebkitBackdropFilter: "blur(18px)",
                backdropFilter: "blur(18px)",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  aria-label="Close"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full active:scale-95 transition-transform"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.16)",
                  }}
                >
                  <X size={20} color="white" />
                </button>

                <div className="text-[10px] tracking-[0.22em] text-white/70">
                  SERVICE
                </div>

                <div className="w-10" />
              </div>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto px-4 sm:px-6 pb-10">
              <div className="pt-8">
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  {selectedContent.title}
                </div>

                <h2
                  className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.78) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {selectedContent.title}
                </h2>

                <p className="mt-6 text-base sm:text-lg text-white/80 leading-relaxed font-light">
                  {selectedContent.details}
                </p>

                <div
                  className="mt-8 rounded-2xl p-5 sm:p-6"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    WebkitBackdropFilter: "blur(20px)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="text-xs tracking-widest text-white/60">
                    WHAT WE DO
                  </div>
                  <ul className="mt-4 space-y-3">
                    {selectedContent.bullets.map((line) => (
                      <li key={line} className="flex gap-3 items-start">
                        <span
                          className="mt-[9px] w-[6px] h-[6px] rounded-full"
                          style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
                        />
                        <span className="text-sm sm:text-base text-white/78 leading-relaxed">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {learnMoreHref ? (
                  <div className="mt-10">
                    <IOSPrimaryButton href={learnMoreHref}>
                      <span className="flex items-center gap-2">
                        Click here to learn more
                        <span className="transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </IOSPrimaryButton>

                    <div className="mt-4 text-center text-xs text-white/45">
                      Tip: tap outside the panel, swipe right, or press Esc to
                      close.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <main className="w-full">
        <section
          id="launchpad"
          className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-10"
        >
          <div className="w-full max-w-2xl">
            <IOSCard className="p-6 sm:p-8">
              <div className="flex items-center justify-center">
                <img
                  src={LOGO_IMAGE_URL}
                  alt="EventureAI"
                  className="w-[200px] h-[200px] object-contain"
                />
              </div>

              <h1 className="mt-6 text-center text-3xl sm:text-4xl tracking-wide font-semibold">
                CPA-led systems that ship.
              </h1>
              <p className="mt-3 text-center text-sm sm:text-base text-black/70">
                We build practical AI + automation, blockchain and digital asset
                systems, full stack web apps, and technical SEO.
              </p>

              <div className="mt-8">
                <div className="text-xs tracking-widest text-black/60">
                  SERVICES
                </div>

                <IOSListCard className="mt-3">
                  <div className="divide-y divide-black/5">
                    {SPOKE_LINKS.map((item) => {
                      const content = SERVICE_CONTENT[item.slug];
                      const description = content
                        ? content.teaser
                        : "Learn more about how we deliver this.";

                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => setSelectedService(item.slug)}
                          className="block w-full text-left px-4 py-4 active:bg-black/5"
                        >
                          <div className="text-base tracking-wide font-semibold">
                            {item.label}
                          </div>
                          <div className="mt-1 text-sm text-black/70">
                            {description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </IOSListCard>
              </div>

              <div className="mt-8 text-xs text-black/55">
                Built by a 25-year CPA, DBA, entrepreneur, and full stack
                developer.
              </div>
            </IOSCard>
          </div>
        </section>
      </main>

      {/* Animations only */}
      <style jsx global>{`
        @keyframes eventureSlideInRight {
          0% {
            transform: translateX(102%);
          }
          60% {
            transform: translateX(-0.5%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
