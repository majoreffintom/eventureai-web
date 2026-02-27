"use client";

import MarketingHeader from "@/components/Marketing/MarketingHeader";

const CORE_EXPERTISE = [
  "25 years as a CPA (controls, compliance, and decision support)",
  "DBA + entrepreneur (real operations and constraints)",
  "Full stack development (web + backend + databases)",
  "Blockchain + digital assets (long-horizon planning + auditability)",
  "Apple + Google developer (shipping to App Store + Google Play)",
  "AI consultant (human–AI systems that stay useful)",
  "SEO (technical cleanup + structure that compounds)",
  "Business consulting (positioning, pricing, execution)",
  "Ethical market design (education-first, fair incentives)",
];

const PRINCIPLES = [
  "Education before monetization",
  "Fair access over privileged information",
  "Sustainability over hype",
  "Long-term human benefit over short-term profit",
  "Systems designed to outlive their builders",
];

export default function AboutPage() {
  return (
    <div
      className="min-h-screen text-black"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <MarketingHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
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
            About Tommy Whittaker
          </h1>

          <p className="mt-4 text-base sm:text-lg text-black/70">
            Founder, systems architect, and builder focused on education-first,
            ethical systems that stay fair under pressure.
          </p>

          <p className="mt-4 text-sm sm:text-base text-black/70">
            I combine <span className="text-black">25 years as a CPA</span> with
            hands-on engineering to ship real products — web, mobile, and
            backend — with clean incentives and long-term usefulness.
          </p>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h2 className="text-xl sm:text-2xl tracking-wide font-semibold">
              Core expertise
            </h2>
            <ul className="mt-4 list-disc pl-5 text-sm sm:text-base text-black/70 space-y-2">
              {CORE_EXPERTISE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h2 className="text-xl sm:text-2xl tracking-wide font-semibold">
              Purpose
            </h2>
            <p className="mt-3 text-sm sm:text-base text-black/70">
              Build education-first, ethical decentralized systems that align
              incentives with long-term human and environmental well-being.
            </p>
            <p className="mt-3 text-sm sm:text-base text-black/70">
              The goal: infrastructures that resist manipulation, prioritize
              fairness, and outlive their creators.
            </p>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h2 className="text-xl sm:text-2xl tracking-wide font-semibold">
              Principles
            </h2>
            <ul className="mt-4 list-disc pl-5 text-sm sm:text-base text-black/70 space-y-2">
              {PRINCIPLES.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h2 className="text-xl sm:text-2xl tracking-wide font-semibold">
              Current focus
            </h2>
            <p className="mt-3 text-sm sm:text-base text-black/70">
              Designing and stewarding ethical decentralized systems that enable
              human freedom, market fairness, and a future where people can step
              away from screens while the systems continue to serve the public
              good.
            </p>
          </div>

          <footer className="mt-10 text-xs text-black/50">
            Last updated January 2026.
          </footer>
        </div>
      </main>
    </div>
  );
}
