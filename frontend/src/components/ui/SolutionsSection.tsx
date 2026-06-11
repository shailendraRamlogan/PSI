"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const solutions = [
  { title: "Import & Export", icon: "📦", image: "/images/industries/import-export.png" },
  { title: "Supply Chain Procurement", icon: "🔗", image: "/images/industries/supply-chain.png" },
  { title: "Hardware", icon: "⚙️", image: "/images/industries/hardware.png" },
  { title: "Finance & Fintech", icon: "💎", image: "/images/industries/finance-fintech.png" },
  { title: "Real Estate", icon: "🏗️", image: "/images/industries/real-estate.png" },
  { title: "Construction & Development", icon: "🏗", image: "/images/industries/construction.png" },
  { title: "Casino & Gaming", icon: "🎰", image: "/images/industries/casino-gaming.png" },
  { title: "E-Commerce", icon: "🛒", image: "/images/industries/ecommerce.png" },
  { title: "Retail", icon: "🏪", image: "/images/industries/retail.png" },
  { title: "Investments", icon: "📈", image: "/images/industries/investments.png" },
];

/* ─── Marquee Item ─── */
function MarqueeItem({ solution }: { solution: (typeof solutions)[0] }) {
  return (
    <div
      className="group flex flex-col items-center cursor-pointer"
      style={{ minWidth: "180px", padding: "0 20px" }}
    >
      <div className="relative w-28 h-28 flex items-center justify-center overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-105 border border-black/10">
        <img
                    src={solution.image}
          alt={solution.title}
          className="w-28 h-28 object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              target.style.display = "none";
              fallback.style.display = "flex";
            }
          }}
        />
        <span
          className="hidden items-center justify-center"
          style={{ fontSize: "48px", lineHeight: 1 }}
        >
          {solution.icon}
        </span>
      </div>
      <span
        className="mt-3 whitespace-nowrap transition-colors duration-200 group-hover:text-[#20aab6]"
        style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)" }}
      >
        {solution.title}
      </span>
    </div>
  );
}

export default function SolutionsSection() {
  const headingChoreographyRef = useHeadingReveal();
  const sectionRef = useRef<HTMLElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dividerRef.current || !sectionRef.current) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const ctx = gsap.context(() => {
      if (dividerRef.current) {
        gsap.to(dividerRef.current, {
          x: 15 * (isMobile ? 0.5 : 1),
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      }
      const sectionGlows = sectionRef.current?.querySelectorAll('[data-section-glow]');
      sectionGlows?.forEach((glow) => {
        gsap.fromTo(glow, { opacity: 0.3 }, {
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%", end: "top 30%", scrub: 0.5, invalidateOnRefresh: true },
        });
        gsap.to(glow, {
          opacity: 0.3,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "bottom 40%", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="solutions" ref={sectionRef} className="relative py-12 sm:py-16 overflow-hidden bg-[#f8f9fb]">
      {/* Section divider glow */}
      <div ref={dividerRef} data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#20aab6]/30 to-transparent" style={{ willChange: "transform" }} />

      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none"
        style={{ background: "linear-gradient(to top, transparent, rgba(248,249,251,0.3))" }} />

      {/* Heading — unchanged */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headingChoreographyRef}
          className="text-center mb-16 sm:mb-20"
        >
          <p
            data-eyebrow
            className="text-xs uppercase tracking-[0.2em] text-[#20aab6] font-medium mb-4"
            style={{ willChange: "transform, opacity" }}
          >
            Solutions for every industry
          </p>
          <h2
            data-heading
            className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight max-w-3xl mx-auto"
            style={{ willChange: "clip-path" }}
          >
            <span className="text-[#1a1a2e]">
              On-ramp, off-ramp liquidity for global solutions in fiat and
              stablecoins.
            </span>
          </h2>
        </div>
      </div>

      {/* Full-width Marquee Strip */}
      <div
        className="w-full overflow-hidden marquee-strip"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="flex w-max marquee-track">
          {solutions.map((s) => (
            <MarqueeItem key={s.title} solution={s} />
          ))}
          {/* Duplicate set for seamless loop */}
          {solutions.map((s) => (
            <MarqueeItem key={`dup-${s.title}`} solution={s} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .marquee-track {
          animation: marquee 30s linear infinite;
        }
        .marquee-strip:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgb(248,249,251))" }} />
    </section>
  );
}
