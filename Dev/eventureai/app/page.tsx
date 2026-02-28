"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ArrowRight } from "lucide-react";

const SERVICES = [
  {
    num: "01",
    name: "Blockchain",
    desc: "Decentralized solutions, smart contracts, and Web3 infrastructure built for enterprise scale. We architect the trust layer for your next-generation applications.",
  },
  {
    num: "02",
    name: "Finance",
    desc: "Fintech platforms, payment processing, and financial modeling. Intelligent automation that turns complex financial workflows into competitive advantages.",
  },
  {
    num: "03",
    name: "Integration",
    desc: "Seamless API orchestration connecting every system in your stack. We eliminate silos and create unified data flows across your entire organization.",
  },
  {
    num: "04",
    name: "Memory",
    desc: "Persistent AI memory layers that learn, adapt, and evolve. Your AI doesn't just respond — it remembers, contextualizes, and anticipates.",
  },
  {
    num: "05",
    name: "Full Stack Web Dev",
    desc: "End-to-end web applications built with modern frameworks. From concept to deployment, we ship production-grade software that scales.",
  },
  {
    num: "06",
    name: "SEO",
    desc: "Data-driven search optimization that compounds over time. We don't chase algorithms — we build organic authority that lasts.",
  },
  {
    num: "07",
    name: "Marketing",
    desc: "AI-enhanced marketing strategies that convert attention into measurable, repeatable growth across every channel that matters.",
  },
  {
    num: "08",
    name: "Business Consulting",
    desc: "Strategic advisory that bridges the gap between technology capability and business transformation. We see the whole picture.",
  },
];

export default function SwissConcept() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 sm:px-12 lg:px-20 py-6 border-b border-black/[0.06]">
        <a
          href="/concepts"
          className="flex items-center gap-2 text-black/30 hover:text-black/60 text-sm transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Concepts</span>
        </a>
        <div className="font-urbanist font-semibold text-lg tracking-tight">
          EventureAI
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#services"
            className="hidden sm:inline text-sm text-black/50 hover:text-black transition-colors"
          >
            Services
          </a>
          <a
            href="#contact"
            className="text-sm text-black/80 hover:text-black transition-colors flex items-center gap-1"
          >
            Contact <ArrowUpRight size={12} />
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 sm:px-12 lg:px-20 pt-20 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32">
        <h1 className="font-urbanist font-medium text-[clamp(2.5rem,8vw,8rem)] leading-[0.9] tracking-tight text-[#111] max-w-[1200px]">
          We build the
          <br />
          infrastructure behind
          <br />
          <span className="text-black/15">ambitious companies.</span>
        </h1>
      </section>

      {/* Divider */}
      <div className="px-6 sm:px-12 lg:px-20">
        <div className="h-px bg-black/[0.08]" />
      </div>

      {/* Services List */}
      <section id="services" className="px-6 sm:px-12 lg:px-20 py-16 sm:py-24">
        <div className="flex items-baseline justify-between mb-10">
          <span className="text-black/25 font-mono text-xs tracking-[0.2em] uppercase">
            Services
          </span>
          <span className="text-black/25 font-mono text-xs">8 Verticals</span>
        </div>

        <div>
          {SERVICES.map((s, i) => {
            const isExpanded = expandedIdx === i;
            return (
              <div key={s.num}>
                <div
                  className="group flex items-baseline gap-4 sm:gap-8 py-5 sm:py-6 cursor-pointer"
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  <span className="font-mono text-xs text-black/20 shrink-0 w-6">
                    {s.num}
                  </span>
                  <h3 className="font-urbanist font-medium text-2xl sm:text-3xl md:text-4xl tracking-tight text-[#111] group-hover:text-emerald-600 transition-colors duration-300 flex-1">
                    {s.name}
                  </h3>
                  <div
                    className={`w-8 h-8 rounded-full border border-black/10 flex items-center justify-center shrink-0 group-hover:border-emerald-500 group-hover:bg-emerald-500 transition-all duration-300 ${isExpanded ? "bg-emerald-500 border-emerald-500" : ""}`}
                  >
                    <ArrowRight
                      size={14}
                      className={`transition-all duration-300 ${isExpanded ? "rotate-90 text-white" : "text-black/30 group-hover:text-white"}`}
                    />
                  </div>
                </div>

                {/* Expanded description */}
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{
                    maxHeight: isExpanded ? "200px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="pl-10 sm:pl-14 pb-6 max-w-2xl">
                    <p className="text-black/40 text-sm sm:text-base leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-black/[0.06]" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 sm:px-12 lg:px-20 py-20 sm:py-32">
        <div className="max-w-4xl">
          <blockquote className="font-urbanist font-medium text-3xl sm:text-5xl leading-[1.1] tracking-tight text-[#111] mb-8">
            "Your vision.
            <br />
            <span className="text-emerald-600">Our architecture."</span>
          </blockquote>
          <p className="text-black/30 text-sm font-mono tracking-wider">
            — EventureAI
          </p>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="px-6 sm:px-12 lg:px-20 py-16 sm:py-24 border-t border-black/[0.06]"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
          <div>
            <span className="text-black/25 font-mono text-xs tracking-[0.2em] uppercase block mb-4">
              Get in touch
            </span>
            <a
              href="mailto:hello@eventureai.com"
              className="font-urbanist font-medium text-2xl sm:text-4xl tracking-tight text-[#111] hover:text-emerald-600 transition-colors border-b-2 border-black/10 hover:border-emerald-600 pb-1"
            >
              hello@eventureai.com
            </a>
          </div>
          <div className="text-right">
            <p className="text-black/30 text-sm">Multi-Tenant AI Platform</p>
            <p className="text-black/30 text-sm">8 Specialized Verticals</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-6 px-6 sm:px-12 lg:px-20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-black/20 text-xs font-mono">
            © 2026 EventureAI
          </div>
          <div className="flex items-center gap-6 text-black/20 text-xs font-mono">
            <a href="#" className="hover:text-black/50 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-black/50 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap');
        .font-urbanist { font-family: 'Urbanist', sans-serif; }
      `}</style>
    </div>
  );
}
