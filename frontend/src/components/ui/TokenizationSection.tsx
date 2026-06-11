"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── Floating Particle (GPU-only transforms) ─── */
function FloatingParticle({ delay, x, size, color = "rgba(108,99,255,0.5)" }: { delay: number; x: number; size: number; color?: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: `${x}%`, background: `radial-gradient(circle, ${color}, transparent)`, willChange: "transform, opacity", backfaceVisibility: "hidden" }}
      animate={{ y: [-20, -90, -20], opacity: [0, 0.6, 0] }}
      transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
      layout={false}
    />
  );
}

/* ─── Investment Overlay Panel (with hover) ─── */
function InvestmentOverlay({
  label, value, sublabel, className, delay, accentColor = "#20aab6", icon,
}: {
  label: string; value: string; sublabel?: string; className?: string;
  delay: number; accentColor?: string; icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`absolute z-30 ${className}`}
      layout={false}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay * 0.75 }}
        whileHover={{ scale: 1.05, y: -2 }}
        className="px-3 py-2.5 sm:px-4 sm:py-3 min-w-[110px] sm:min-w-[130px] relative overflow-hidden cursor-default hover:shadow-[0_0_20px_rgba(108,99,255,0.08)] transition-[border-color,box-shadow] duration-300"
        style={{
          background: "rgba(10,15,30,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
        }}
      >
        <div className="absolute top-0 left-2 right-2 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}70, transparent)` }} />
        <div className="absolute -inset-1 rounded-lg pointer-events-none" style={{ boxShadow: `0 0 12px ${accentColor}08` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center gap-1 relative">
          {icon && <span style={{ color: accentColor }} className="opacity-50">{icon}</span>}
          <p className="text-[7px] sm:text-[8px] text-white/25 uppercase tracking-[0.15em] font-semibold">{label}</p>
        </div>
        <p className="text-sm sm:text-base font-bold text-white/90 mt-0.5 relative">{value}</p>
        {sublabel && <p className="text-[7px] text-white/15 mt-0.5 relative">{sublabel}</p>}
      </motion.div>
    </motion.div>
  );
}

/* ─── Mini Chart ─── */
function MiniChart({ className, delay, color = "#20aab6", label = "Growth" }: { className?: string; delay: number; color?: string; label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.6 }}
      className={`absolute z-30 ${className}`}
      layout={false}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="glass rounded-lg px-2.5 py-1.5 backdrop-blur-md"
      >
        <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
          <defs><linearGradient id={`cg${delay}${label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d="M0 20 L8 17 L16 19 L24 14 L32 16 L40 10 L48 11 L56 5 L64 2" stroke={color} strokeWidth="1.2" fill="none" />
          <path d="M0 20 L8 17 L16 19 L24 14 L32 16 L40 10 L48 11 L56 5 L64 2 L64 24 L0 24Z" fill={`url(#cg${delay}${label})`} />
        </svg>
        <p className="text-[7px] text-white/20 mt-0.5 font-medium">{label}</p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Building Tile ─── */
const TILE_COUNT = 108;
const OWNED_INDICES = new Set([0,2,4,5,7,8,10,12,15,16,18,20,22,24,25,27,29,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106]);

function BuildingTile({ owned }: { owned: boolean }) {
  return (
    <div
      className="rounded-[4px]"
      style={{
        background: owned
          ? "linear-gradient(135deg, #C9A84C, #F5D38A)"
          : "#1a1f35",
        border: owned
          ? "1px solid rgba(249,211,138,0.3)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: owned
          ? "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(201,168,76,0.15)"
          : "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════
   RESORT SCENE — Compact Cinematic Layers
   ═══════════════════════════════════════════════ */
function ResortScene() {
  // Pre-generate owned/unowned tiles
  const [tiles] = useState(() =>
    Array.from({ length: TILE_COUNT }, (_, i) => ({ owned: OWNED_INDICES.has(i) }))
  );
  const mainTiles = tiles.slice(0, 60);
  const wing1Tiles = tiles.slice(60, 80);
  const wing2Tiles = tiles.slice(80, 100);
  const pentTiles = tiles.slice(100, 108);

  return (
    <div data-scene-wrapper className="relative w-full aspect-[16/6.5] sm:aspect-[16/5.5] min-h-[380px] sm:min-h-[460px] overflow-hidden rounded-2xl">

      {/* ═══ Full Background Image ═══ */}
      <img src="/resort-tokenization.png" alt="Resort tokenization" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* Particles (8) */}
      {[
        { x: 8, d: 0 }, { x: 22, d: 2 }, { x: 38, d: 0.5 }, { x: 52, d: 3 },
        { x: 68, d: 1 }, { x: 82, d: 2.5 }, { x: 45, d: 4 }, { x: 15, d: 1.5 },
      ].map((p, i) => (
        <FloatingParticle key={i} x={p.x} delay={p.d} size={1.5 + Math.random() * 1.5}
          color={["rgba(108,99,255,0.4)", "rgba(59,130,246,0.3)", "rgba(139,92,246,0.35)", "rgba(232,160,69,0.25)"][i % 4]} />
      ))}

      {/* ═══ Investment Overlays ═══ */}
      <InvestmentOverlay label="Total Value" value="$45M" sublabel="Caribbean Development"
        className="top-2 right-2 sm:top-4 sm:right-5" delay={0.5} accentColor="#20aab6"
        icon={<svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>} />
      <InvestmentOverlay label="Min. Investment" value="$500" sublabel="Per share"
        className="bottom-3 left-2 sm:bottom-5 sm:left-5" delay={0.7} accentColor="#06b6d4" />
      <InvestmentOverlay label="Projected APY" value="18.5%" sublabel="5-year"
        className="top-2 left-2 sm:top-4 sm:left-5" delay={0.6} accentColor="#10b981"
        icon={<svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      <InvestmentOverlay label="Investors" value="1,247" sublabel="Active"
        className="bottom-3 right-2 sm:bottom-5 sm:right-5" delay={0.8} accentColor="#f7931a" />
      <InvestmentOverlay label="Ownership" value="0.05%" sublabel="Per $500"
        className="hidden lg:block top-[42%] right-2 sm:right-5" delay={1.0} accentColor="#20aab6" />
      <InvestmentOverlay label="Proj. Returns" value="$92,500" sublabel="5yr on $500"
        className="hidden md:block top-[42%] left-2 sm:left-5" delay={1.2} accentColor="#a78bfa" />

      {/* Tokenized badge */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: 1.4 }} className="absolute top-2 left-1/2 -translate-x-1/2 z-30" layout={false}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass backdrop-blur-md" style={{ animation: "badgeFloat 3.5s ease-in-out infinite" }}>
          <div className="w-1 h-1 rounded-full bg-cyan-400/50" style={{ animation: "beaconPulse 2s ease-in-out infinite" }} />
          <span className="text-[8px] text-white/30 uppercase tracking-[0.15em] font-semibold">Tokenized Asset</span>
        </div>
      </motion.div>

      {/* Mini charts */}
      <MiniChart className="bottom-20 sm:bottom-28 right-8 sm:right-12" delay={0.9} color="#20aab6" label="Growth" />
      <MiniChart className="top-20 sm:top-24 left-[28%]" delay={1.3} color="#20aab6" label="Yield" />

      {/* Cinematic overlays */}
      <div className="absolute inset-x-0 top-0 h-12 sm:h-20 bg-gradient-to-b from-[#07080f]/70 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 sm:h-32 bg-gradient-to-t from-[#07080f] via-[#07080f]/50 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-6 sm:w-14 bg-gradient-to-r from-[#07080f]/30 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-6 sm:w-14 bg-gradient-to-l from-[#07080f]/30 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.012]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)" }} />
      <div className="absolute inset-0 z-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(7,8,15,0.35) 100%)" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SECTION — Tighter Layout
   ═══════════════════════════════════════════════ */
export default function TokenizationSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingChoreographyRef = useHeadingReveal({ start: "top 85%" });
  const sceneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const bgOrbsRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const parallaxMult = isMobile ? 0.5 : 1;

    const ctx = gsap.context(() => {
      // Beachfront scene: reveal curtain — brightness 0.7 → 1.0
      const sceneWrapper = sectionRef.current!.querySelector('[data-scene-wrapper]') as HTMLElement;
      if (sceneWrapper) {
        gsap.set(sceneWrapper, { filter: "brightness(0.7)" });
        gsap.to(sceneWrapper, {
          filter: "brightness(1)",
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });
      }

      // Beachfront image parallax (0.5x — moves slower than content)
      if (sceneRef.current) {
        gsap.to(sceneRef.current, {
          y: -40 * parallaxMult,
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

      // Content at 0.9x parallax
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          y: -15 * parallaxMult,
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

      // Background ambient orbs at 0.3x
      if (bgOrbsRef.current) {
        gsap.to(bgOrbsRef.current, {
          y: -10 * parallaxMult,
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

      // Investment panels stagger in + glow bloom on each
      const panels = sectionRef.current!.querySelectorAll('[data-invest-panel]');
      if (panels.length > 0) {
        gsap.set(panels, { opacity: 0.15, y: 20, scale: 0.95 });
        gsap.to(panels, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.06,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });

        // Glow bloom on each panel
        panels.forEach((panel, i) => {
          const glow = panel.querySelector('[data-panel-glow]') as HTMLElement;
          if (glow) {
            gsap.set(glow, { opacity: 0 });
            gsap.to(glow, {
              opacity: 1,
              duration: 1.0,
              delay: i * 0.06,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none none",
                invalidateOnRefresh: true,
              },
            });
          }
        });
      }

      // "Coming Soon" badge: scale bounce (1.0 → 1.15 → 1.0)
      if (comingSoonRef.current) {
        gsap.fromTo(
          comingSoonRef.current,
          { scale: 1, opacity: 0.1 },
          {
            scale: 1.15,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.2)",
            delay: 0.5,
            force3D: true,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
            onComplete: () => {
              gsap.to(comingSoonRef.current, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out",
                force3D: true,
              });
            },
          }
        );
      }

      // Scroll-reactive glow — brightens on entry, dims on exit
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
    <section ref={sectionRef} className="relative py-12 sm:py-16 overflow-hidden">
      {/* Divider */}
      <div data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-[#20aab6]/12 to-transparent" />

      {/* Ambient bg orbs — parallax at 0.3x */}
      <div ref={bgOrbsRef} className="pointer-events-none" style={{ willChange: "transform" }}>
        <div className="absolute top-1/3 left-[5%] w-[400px] h-[400px] rounded-full bg-[#20aab6]/[0.015] blur-[100px]" />
        <div className="absolute bottom-1/3 right-[5%] w-[350px] h-[350px] rounded-full bg-[#06b6d4]/[0.012] blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-[#e8a045]/[0.008] blur-[60px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ═══ Heading — clip-path choreography ═══ */}
        <div ref={headingChoreographyRef} className="text-center mb-6 sm:mb-8">
          <div ref={comingSoonRef} data-eyebrow className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass mb-3" style={{ willChange: "transform, opacity" }}>
            <div className="w-1 h-1 rounded-full bg-cyan-400/50" style={{ animation: "beaconPulse 2s ease-in-out infinite" }} />
            <span className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-semibold">Coming Soon</span>
          </div>
          <h2 data-heading className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.75rem] font-bold leading-tight" style={{ willChange: "clip-path" }}>
            <span className="text-white">Tokenization Projects</span>
          </h2>
          <p data-subtitle className="mt-2 text-[11px] sm:text-xs text-white/20 max-w-sm mx-auto leading-relaxed" style={{ willChange: "transform, opacity" }}>
            Institutional-grade fractional ownership of premium real estate
          </p>
        </div>

        {/* ═══ Resort Scene — dominant ═══ */}
        <motion.div ref={sceneRef} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }} className="relative" style={{ willChange: "transform", backfaceVisibility: "hidden" }} layout={false}>
          <ResortScene />
          <div className="absolute inset-0 rounded-2xl border border-white/[0.05] pointer-events-none z-40" />
          {/* Ambient glow behind scene */}
          <div className="absolute -inset-4 rounded-3xl bg-[#20aab6]/[0.02] blur-xl pointer-events-none -z-10" />
          <div className="absolute -inset-4 rounded-3xl bg-[#20aab6]/[0.015] blur-xl pointer-events-none -z-10" />
        </motion.div>

        {/* ═══ Caption — tighter ═══ */}
        <motion.div ref={contentRef} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} className="mt-5 sm:mt-6 text-center" style={{ willChange: "transform", backfaceVisibility: "hidden" }} layout={false}>
          <h3 className="text-base sm:text-lg font-semibold text-white/65">Luxury Beachfront Resort</h3>
          <p className="text-[9px] sm:text-[10px] text-white/15 mt-0.5 uppercase tracking-wider font-medium">
            Caribbean Development · Tokenized Fractional Ownership
          </p>
          <p className="mt-2.5 text-xs sm:text-sm text-white/25 max-w-md mx-auto leading-relaxed">
            Fractional ownership of real estate development projects for exceptional return on investment. Pay with credit card or fiat.
          </p>
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4">
            {[
              { label: "Fractional Shares", color: "#20aab6" },
              { label: "From $500", color: "#06b6d4" },
              { label: "18.5% APY", color: "#10b981" },
              { label: "SEC Compliant", color: "#f7931a" },
              { label: "Audited", color: "#20aab6" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.025] border border-white/[0.04]">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: b.color, opacity: 0.5 }} />
                <span className="text-[9px] text-white/25 font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* All animations — CSS keyframes for GPU compositing */}
      <style jsx global>{`
        @keyframes starTwinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.55; } }
        @keyframes cloudDrift { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes shimmerLine { 0%, 100% { opacity: 0.04; transform: translateX(-5%); } 50% { opacity: 0.12; transform: translateX(5%); } }
        @keyframes reflPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        @keyframes palmSway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes beaconPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        @keyframes badgeFloat { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-3px); } }
      `}</style>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgb(7,8,15))" }} />
    </section>
  );
}
