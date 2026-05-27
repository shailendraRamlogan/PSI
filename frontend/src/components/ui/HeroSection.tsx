"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), {
  ssr: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.12 * i, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

/* ─── Panel definitions ─── */
interface PanelDef {
  id: string;
  title: string;
  x: string;
  delay: number;
  scale?: number;
  content: React.ReactNode;
}

function FloatingPanel({ panel }: { panel: PanelDef }) {
  const panelScale = panel.scale ?? 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: panel.delay, duration: 0.7 }}
      className={`absolute ${panel.x} z-10 pointer-events-none hidden md:block`}
      layout={false}
      style={{ transform: `translate3d(0, 0, 0) scale(${panelScale})`, willChange: "transform, opacity" }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
        className="glass rounded-lg px-3 py-2 min-w-[130px] max-w-[170px] backdrop-blur-md"
        layout={false}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#20aab6]/60" style={{ animation: "beaconPulse 2s ease-in-out infinite" }} />
          <span className="text-[7px] text-white/25 uppercase tracking-[0.15em] font-semibold">{panel.title}</span>
        </div>
        {panel.content}
      </motion.div>
    </motion.div>
  );
}

const panels: PanelDef[] = [
  {
    id: "fx", title: "FX CONVERSION", x: "left-[44%] top-[15%]", delay: 1.0, scale: 0.95,
    content: (
      <div>
        <p className="text-[10px] font-semibold text-white/50">EUR → USD</p>
        <p className="text-base font-bold text-white/90 font-mono">1.0847</p>
        <p className="text-[8px] text-emerald-400/70 font-medium">+0.12%</p>
      </div>
    ),
  },
  {
    id: "transfer", title: "LIVE TRANSFER", x: "right-[18%] top-[12%]", delay: 0.8, scale: 0.92,
    content: (
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white/60">USD</span>
          <svg className="w-2.5 h-2.5 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          <span className="text-[11px] font-bold text-white/60">USDT</span>
        </div>
        <p className="text-xs font-bold text-white/85 mt-0.5">$12,450.00</p>
        <p className="text-[8px] mt-0.5 text-emerald-400 font-medium">✓ Confirmed</p>
      </div>
    ),
  },
  {
    id: "metric", title: "24H VOLUME", x: "left-[42%] top-[42%]", delay: 2.2, scale: 1.05,
    content: (
      <div>
        <p className="text-base font-bold text-white/85">$48.2M</p>
        <p className="text-[7px] text-emerald-400/60 font-medium">+12.4% vs avg</p>
      </div>
    ),
  },
  {
    id: "routing", title: "STABLECOIN ROUTE", x: "right-[8%] top-[48%]", delay: 1.6, scale: 0.9,
    content: (
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-1 py-0.5 rounded bg-white/[0.05] text-white/40 font-mono">TRC-20</span>
          <span className="text-[11px] font-bold text-white/60">USDT</span>
        </div>
        <p className="text-[8px] text-white/25 mt-0.5">Est. ~3 min</p>
      </div>
    ),
  },
  {
    id: "confirm", title: "TX CONFIRMED", x: "left-[46%] bottom-[22%]", delay: 1.4, scale: 0.93,
    content: (
      <div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <svg className="w-1.5 h-1.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <span className="text-[9px] font-mono text-white/45">0x7a3f...e92b</span>
        </div>
        <p className="text-[7px] text-white/25 mt-0.5">Ethereum · 12 confirmations</p>
      </div>
    ),
  },
  {
    id: "liquidity", title: "LIQUIDITY POOL", x: "right-[12%] bottom-[18%]", delay: 1.8, scale: 0.88,
    content: (
      <div>
        <p className="text-[10px] font-bold text-white/60">USDC Pool</p>
        <p className="text-xs font-bold text-white/85">$8.2M</p>
        <p className="text-[8px] text-[#20aab6]/70 font-medium">APY 4.8%</p>
      </div>
    ),
  },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const gradientRefs = useRef<(HTMLDivElement | null)[]>([]);
  // ─── Task 4: Use ref instead of state for scroll-driven globe rotation ───
  const scrollProgressRef = useRef(0);
  // State only for re-rendering the canvas — thresholded to avoid per-frame re-renders
  const [scrollProgress, setScrollProgress] = useState(0);

  const setGradientRef = useCallback((el: HTMLDivElement | null, idx: number) => {
    if (el) gradientRefs.current[idx] = el;
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current || !canvasWrapperRef.current) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const parallaxMult = isMobile ? 0.5 : 1;

    const ctx = gsap.context(() => {
      // Track scroll progress for globe rotation — ref-based with thresholded state update (Task 4)
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const newProgress = self.progress;
          scrollProgressRef.current = newProgress;
          // Only trigger re-render if change exceeds threshold (avoids per-frame setState)
          if (Math.abs(newProgress - scrollProgress) > 0.005) {
            setScrollProgress(newProgress);
          }
        },
      });

      // Parallax: text content moves at 0.8x
      gsap.to(contentRef.current, {
        y: 120 * parallaxMult,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      // Parallax: globe/canvas moves at 0.3x
      gsap.to(canvasWrapperRef.current, {
        y: 40 * parallaxMult,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      // Text fades out as you scroll past
      gsap.to(contentRef.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "20% top",
          end: "70% top",
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      });

      // Staggered parallax on floating panels — clamped to prevent zone drift
      const panelSpeeds = [40, 50, 60, 55, 45, 35];
      const panelEls = sectionRef.current!.querySelectorAll('[data-panel]');
      panelEls.forEach((panel, i) => {
        gsap.to(panel, {
          y: Math.min(panelSpeeds[i % panelSpeeds.length] * parallaxMult, 60),
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      });

      // Ambient gradient drift — desktop only (Task 7: skip on mobile)
      if (!isMobile) {
        gradientRefs.current.forEach((glow, i) => {
          if (!glow) return;
          const driftRange = 15;
          const phase = i * 2.1;
          gsap.to(glow, {
            x: driftRange * Math.cos(phase),
            y: driftRange * 0.5 * Math.sin(phase),
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

          // Scroll-reactive glow — dims as hero scrolls out
          gsap.to(glow, {
            opacity: 0.3,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "40% top",
              end: "bottom top",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Base dark */}
      <div className="absolute inset-0 z-0 bg-[#07080F]" />

      {/* Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[60%] opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(32,170,182,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(32,170,182,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px", transform: "perspective(500px) rotateX(60deg)", transformOrigin: "bottom center",
            animation: "gridScroll 20s linear infinite",
          }} />
      </div>

      {/* Gradient lighting */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div ref={(el) => setGradientRef(el, 0)} data-section-glow className="absolute w-[800px] h-[800px] rounded-full blur-[150px]"
          style={{ background: "radial-gradient(circle, rgba(32,170,182,0.08) 0%, transparent 70%)", top: "5%", left: "15%", animation: "ambientPulse1 8s ease-in-out infinite", willChange: "transform", backfaceVisibility: "hidden" }} />
        <div ref={(el) => setGradientRef(el, 1)} data-section-glow className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(32,170,182,0.06) 0%, transparent 70%)", top: "20%", right: "10%", animation: "ambientPulse2 10s ease-in-out infinite", willChange: "transform", backfaceVisibility: "hidden" }} />
        <div ref={(el) => setGradientRef(el, 2)} data-section-glow className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(32,170,182,0.05) 0%, transparent 70%)", bottom: "10%", left: "35%", animation: "ambientPulse3 12s ease-in-out infinite", willChange: "transform", backfaceVisibility: "hidden" }} />
      </div>

      {/* Light streaks */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <div className="absolute w-[200%] h-[1px] opacity-[0.06]" style={{ background: "linear-gradient(90deg, transparent, #20aab6, transparent)", top: "30%", animation: "streakMove1 12s ease-in-out infinite" }} />
        <div className="absolute w-[200%] h-[1px] opacity-[0.04]" style={{ background: "linear-gradient(90deg, transparent, #20aab6, transparent)", top: "55%", animation: "streakMove2 16s ease-in-out infinite" }} />
      </div>

      {/* 3D Canvas — globe */}
      <div ref={canvasWrapperRef} className="absolute inset-0 z-[3] md:left-[20%] md:right-[-15%] opacity-35 md:opacity-95 scale-[1.2] md:scale-[1.35] origin-center md:origin-[55%_50%]"
        style={{ willChange: "transform", backfaceVisibility: "hidden", transform: "translate3d(0, 0, 0)" }}>
        <HeroCanvas scrollProgress={scrollProgress} />
      </div>

      {/* Vignettes */}
      <div className="absolute inset-0 z-[4] pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-[#07080F] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#07080F] via-[#07080F]/40 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#07080F]/50 to-transparent" />
      </div>

      {/* Content — ~40% left */}
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        style={{ willChange: "transform, opacity", backfaceVisibility: "hidden", transform: "translate3d(0, 0, 0)" }}>
        <div className="max-w-[420px] lg:max-w-[460px] pt-24 sm:pt-28 pb-16 md:pt-0 md:pb-0">
          <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-5" layout={false}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[9px] font-medium text-white/35 tracking-[0.14em] uppercase">Trusted by businesses worldwide</span>
          </motion.div>

          <motion.h1 custom={1} variants={fadeInUp} initial="hidden" animate="visible"
            className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] font-bold leading-[1.15] tracking-tight" layout={false}>
            <span className="text-white">Your payment</span>
            <br />
            <span className="text-white">solutions </span>
            <span className="text-[#20aab6]">begin here.</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeInUp} initial="hidden" animate="visible"
            className="mt-4 text-[13px] sm:text-sm text-white/30 max-w-[380px] leading-relaxed" layout={false}>
            On-ramp, off-ramp liquidity for global solutions in Fiat and Stablecoins. Seamless cross-border payments, conversions, and institutional-grade infrastructure — built for the modern economy.
          </motion.p>

          <motion.div custom={3} variants={fadeInUp} initial="hidden" animate="visible" className="mt-6 flex flex-wrap gap-2.5" layout={false}>
            <Link href="/get-started">
              <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-6 py-2.5 rounded-full text-[13px] font-semibold text-white flex items-center gap-2 group
                  bg-[#20aab6]
                  shadow-[0_0_20px_rgba(32,170,182,0.25),0_0_60px_rgba(32,170,182,0.1)]
                  hover:shadow-[0_0_30px_rgba(32,170,182,0.35),0_0_80px_rgba(32,170,182,0.15)]
                  transition-shadow duration-500" layout={false}>
                <span className="absolute inset-0 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                <span className="relative flex items-center gap-2">
                  Get Started
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
              </motion.button>
            </Link>
            <Link href="#solutions">
              <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-6 py-2.5 rounded-full text-[13px] font-medium text-white/45 hover:text-white/75
                  bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300" layout={false}>
                Learn More
              </motion.button>
            </Link>
          </motion.div>

          <motion.div custom={4} variants={fadeInUp} initial="hidden" animate="visible" className="mt-8 flex gap-8" layout={false}>
            {[
              { value: "40+", label: "Countries" },
              { value: "$2B+", label: "Volume" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="group cursor-default">
                <div className="text-lg sm:text-xl font-bold text-white group-hover:text-[#20aab6] transition-all duration-500">{stat.value}</div>
                <div className="text-[9px] text-white/20 mt-0.5 tracking-wider uppercase font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes ambientPulse1 { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes ambientPulse2 { 0%, 100% { opacity: 0.6; transform: scale(1.05); } 50% { opacity: 1; transform: scale(0.95); } }
        @keyframes ambientPulse3 { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.08); } }
        @keyframes gridScroll { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
        @keyframes streakMove1 { 0%, 100% { transform: translateX(-30%); opacity: 0.06; } 50% { transform: translateX(10%); opacity: 0.1; } }
        @keyframes streakMove2 { 0%, 100% { transform: translateX(10%); opacity: 0.04; } 50% { transform: translateX(-20%); opacity: 0.08; } }
        @keyframes beaconPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
      `}</style>
    </section>
  );
}
