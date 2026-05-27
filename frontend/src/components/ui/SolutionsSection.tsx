"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const solutions = [
  {
    title: "Import & Export",
    icon: "📦",
  },
  {
    title: "Supply Chain Procurement",
    icon: "🔗",
  },
  {
    title: "Manufacturing",
    icon: "🏭",
  },
  {
    title: "Hardware",
    icon: "⚙️",
  },
  {
    title: "Finance & Fintech",
    icon: "💎",
  },
  {
    title: "Real Estate",
    icon: "🏗️",
  },
  {
    title: "Construction & Development",
    icon: "🏗",
  },
  {
    title: "Casino & Gaming",
    icon: "🎰",
  },
  {
    title: "E-Commerce",
    icon: "🛒",
  },
  {
    title: "Retail",
    icon: "🏪",
  },
  {
    title: "Investments",
    icon: "📈",
  },
  {
    title: "Personalized Liquidity",
    icon: "🌊",
  },
];

/* ─── Marquee Item ─── */
function MarqueeItem({ solution }: { solution: (typeof solutions)[0] }) {
  return (
    <div
      className="group flex flex-col items-center gap-2.5 cursor-pointer"
      style={{ minWidth: "160px", padding: "0 24px" }}
    >
      <span
        className="block transition-transform duration-200 group-hover:scale-110"
        style={{ fontSize: "40px", lineHeight: 1 }}
      >
        {solution.icon}
      </span>
      <span
        className="whitespace-nowrap transition-colors duration-200 group-hover:text-white"
        style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}
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
    <section id="solutions" ref={sectionRef} className="relative py-12 sm:py-16 overflow-hidden">
      {/* Section divider glow */}
      <div ref={dividerRef} data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#20aab6]/30 to-transparent" style={{ willChange: "transform" }} />

      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none"
        style={{ background: "linear-gradient(to top, transparent, rgba(7,8,15,0.3))" }} />

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
            <span className="text-white">
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
        style={{ background: "linear-gradient(to bottom, transparent, rgb(7,8,15))" }} />
    </section>
  );
}
