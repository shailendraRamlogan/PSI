"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── Currency Particles ─── */
function CurrencyParticles() {
  const symbols = ["$", "₿", "₮", "€", "£", "¥"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          className="absolute text-white/[0.06] text-lg sm:text-2xl font-bold select-none"
          style={{
            left: `${10 + i * 16}%`,
            top: `${15 + (i % 3) * 28}%`,
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-5, 5, -5],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 5 + i * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Animation Phase Types ─── */
type AnimPhase = "HERO" | "INTRO" | "IDLE" | "INSERT" | "READING" | "PROCESSING" | "PAID" | "OUTRO" | "RESET";

const PHASE_DURATIONS: Record<AnimPhase, number> = {
  HERO: 2000,
  INTRO: 1000,
  IDLE: 800,
  INSERT: 800,
  READING: 2000,
  PROCESSING: 2000,
  PAID: 1500,
  OUTRO: 1000,
  RESET: 500,
};

/* ─── 3D Visa Card with Reader Animation ─── */
function VisaCardWithAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const [phase, setPhase] = useState<AnimPhase>("HERO");
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Track all timeouts for proper cleanup
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const isRunningRef = useRef(false);
  const hasCompletedCycleRef = useRef(false);
  const wasInViewRef = useRef(false);

  const cancelAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const resetAnimation = useCallback(() => {
    cancelAllTimers();
    setPhase("HERO");
    isRunningRef.current = false;
    hasCompletedCycleRef.current = false;
  }, [cancelAllTimers]);

  const runPhase = useCallback((currentPhase: AnimPhase) => {
    if (!isRunningRef.current) return;

    const duration = PHASE_DURATIONS[currentPhase];
    const nextPhase: Record<AnimPhase, AnimPhase> = {
      HERO: "INTRO",
      INTRO: "IDLE",
      IDLE: "INSERT",
      INSERT: "READING",
      READING: "PROCESSING",
      PROCESSING: "PAID",
      PAID: "OUTRO",
      OUTRO: "RESET",
      RESET: "HERO",
    };

    setPhase(currentPhase);

    const id = setTimeout(() => {
      if (!isRunningRef.current) return;
      const next = nextPhase[currentPhase];
      if (next === "HERO") {
        // End of cycle — pause briefly then auto-loop if still in view
        isRunningRef.current = false;
        setPhase("HERO");
        hasCompletedCycleRef.current = true;
        const reloopId = setTimeout(() => {
          if (wasInViewRef.current) {
            hasCompletedCycleRef.current = false;
            isRunningRef.current = true;
            runPhase("HERO");
          }
        }, 500);
        timersRef.current.push(reloopId);
        return;
      }
      runPhase(next);
    }, duration);

    timersRef.current.push(id);
  }, []);

  const startAnimation = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    runPhase("HERO");
  }, [runPhase]);

  useEffect(() => {
    if (isInView && !wasInViewRef.current) {
      // Entering view
      if (hasCompletedCycleRef.current) {
        resetAnimation();
        // Small delay to let state flush before restarting
        const id = setTimeout(() => startAnimation(), 50);
        timersRef.current.push(id);
      } else if (!isRunningRef.current) {
        startAnimation();
      }
    } else if (!isInView && wasInViewRef.current) {
      // Exiting view — pause by cancelling pending timers
      cancelAllTimers();
      isRunningRef.current = false;
    }
    wasInViewRef.current = isInView;
  }, [isInView, resetAnimation, startAnimation, cancelAllTimers]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: -y * 15, y: x * 15 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const cardNumber = "4539 •••• •••• 7281";

  // Animation state derived from phase
  const showReader = phase !== "HERO" && phase !== "RESET";
  const readerVisible = phase === "INTRO" || phase === "IDLE" || phase === "INSERT" ||
    phase === "READING" || phase === "PROCESSING" || phase === "PAID" || phase === "OUTRO";

  // Card Y offset — shifts up during INTRO/IDLE, slides down during INSERT, stays in during READING/PROCESSING/PAID, back up during OUTRO
  // Card width matches reader (280/340px), slight overlap on insert without covering screen
  let cardY = 0;
  let cardScale = 1;
  if (phase === "HERO" || phase === "RESET") { cardY = 0; cardScale = 1; }
  else if (phase === "INTRO") { cardY = -30; cardScale = 0.75; }
  else if (phase === "IDLE") { cardY = -30; cardScale = 0.75; }
  else if (phase === "INSERT") { cardY = 20; cardScale = 0.75; }
  else if (phase === "READING" || phase === "PROCESSING" || phase === "PAID") { cardY = 20; cardScale = 0.75; }
  else if (phase === "OUTRO") { cardY = 0; cardScale = 1; }

  // Slot color
  let slotColor = "bg-gray-700";
  let slotGlow = "";
  let cardFlash = false;

  if (phase === "READING") {
    slotColor = "bg-blue-500";
    slotGlow = "shadow-[0_0_20px_rgba(68,136,255,0.6)]";
  } else if (phase === "PROCESSING") {
    slotColor = "bg-amber-500";
    slotGlow = "shadow-[0_0_20px_rgba(255,170,0,0.6)]";
  } else if (phase === "PAID") {
    slotColor = "bg-emerald-400";
    slotGlow = "shadow-[0_0_25px_rgba(0,255,136,0.7)]";
    cardFlash = true;
  }

  // Reader Y position — starts offscreen, slides up
  let readerY = 120; // offscreen below
  if (phase === "INTRO") readerY = 30;
  else if (phase === "IDLE" || phase === "INSERT" || phase === "READING" || phase === "PROCESSING" || phase === "PAID") readerY = 0;
  else if (phase === "OUTRO") readerY = 120;

  return (
    <div ref={containerRef}>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex justify-center"
      layout={false}
    >
      <div
        className="relative"
        style={{ perspective: "1000px" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card glow */}
        <div className="absolute -inset-8 bg-[#20aab6]/10 rounded-3xl blur-2xl opacity-60" />
        <div className="absolute -inset-4 bg-[#20aab6]/10 rounded-2xl blur-xl" />

        {/* Card glow bloom */}
        <div data-card-bloom className="absolute -inset-6 rounded-3xl pointer-events-none"
          style={{
            boxShadow: "0 0 40px rgba(108,99,255,0.12), 0 0 80px rgba(59,130,246,0.06)",
            willChange: "opacity",
          }} />

        {/* Card + Reader Container */}
        <div className="relative" style={{ minHeight: "350px" }}>

          {/* Card */}
          <motion.div
            animate={{
              rotateX: phase === "HERO" || phase === "RESET" ? rotation.x : 0,
              rotateY: phase === "HERO" || phase === "RESET" ? rotation.y : 0,
              y: phase === "HERO" || phase === "RESET"
                ? (isHovered ? -8 : [0, -6, 0])
                : cardY,
              scale: cardScale,
            }}
            transition={
              phase === "HERO" || phase === "RESET"
                ? (isHovered ? { duration: 0.1 } : { duration: 4, repeat: Infinity, ease: "easeInOut" })
                : { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
            }
            className="relative w-[280px] sm:w-[340px] h-[170px] sm:h-[200px] rounded-2xl overflow-hidden z-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Card background — silver metallic */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400" />

            {/* Card flash for PAID state */}
            {cardFlash && (
              <motion.div
                className="absolute inset-0 bg-white z-20"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}

            {/* Metallic shimmer overlay */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 48%, rgba(255,255,255,0.1) 52%, transparent 70%)",
                backgroundSize: "250% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Subtle fintech pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(0,0,0,0.1) 10px,
                  rgba(0,0,0,0.1) 11px
                )`
              }}
            />

            {/* Card content */}
            <div className="relative z-10 p-5 sm:p-6 h-full flex flex-col justify-between">
              {/* Top row — chip + contactless */}
              <div className="flex items-center gap-3">
                {/* Chip */}
                <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-md bg-gradient-to-br from-yellow-600/80 via-yellow-500 to-yellow-700/80 border border-yellow-600/30 flex items-center justify-center">
                  <div className="w-6 sm:w-8 h-[1px] bg-yellow-800/40" />
                  <div className="absolute w-[1px] h-4 sm:h-5 bg-yellow-800/40" />
                </div>
                {/* Contactless */}
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500/60"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" opacity="0.3" />
                  <path d="M7.5 7.5c2.5-2.5 6.5-2.5 9 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M9.5 9.5c1.5-1.5 3.5-1.5 5 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M11.5 11.5c.5-.5 1.5-.5 2 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              {/* Card number */}
              <div className="mt-auto">
                <p className="text-slate-700/80 text-base sm:text-lg font-[450] tracking-[0.15em] font-mono">
                  {cardNumber}
                </p>

                {/* Bottom row */}
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">
                      Card Holder
                    </p>
                    <p className="text-xs sm:text-sm text-slate-700/90 font-medium tracking-wide uppercase">
                      John Smith
                    </p>
                  </div>

                  {/* Visa logo */}
                  <div className="flex flex-col items-end">
                    <svg
                      className="w-12 sm:w-14 h-auto"
                      viewBox="0 0 48 16"
                      fill="none"
                    >
                      <text
                        x="0"
                        y="14"
                        fill="#1A1F71"
                        fontFamily="system-ui, sans-serif"
                        fontWeight="800"
                        fontStyle="italic"
                        fontSize="16"
                      >
                        VISA
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Edge highlight */}
            <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none" />
          </motion.div>

          {/* Card Reader Terminal */}
          <motion.div
            initial={false}
            animate={{ y: readerY, opacity: readerVisible ? 1 : 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-1/2 -translate-x-1/2 w-[280px] sm:w-[340px] z-20"
            style={{ top: "180px" }}
          >
            {/* Terminal body */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 pt-6 border border-gray-700/50 shadow-2xl">

              {/* Card slot — upper portion of reader */}
              <div className="relative flex justify-center mb-4">
                <motion.div
                  className={`w-[260px] sm:w-[320px] h-3 rounded-full ${slotColor} ${slotGlow} transition-colors duration-500`}
                  animate={phase === "READING" || phase === "PROCESSING" ? {
                    opacity: [0.5, 1, 0.5],
                  } : {}}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Display screen — lower portion of reader, below the slot */}
              <div className="bg-gray-950 rounded-lg p-3 mb-3 border border-gray-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">PSI TERMINAL</span>
                  <span className="text-[10px] text-gray-600 font-mono">v3.2</span>
                </div>

                {/* Status line */}
                <div className="mt-2 h-4 flex items-center">
                  {phase === "IDLE" && (
                    <span className="text-[11px] text-gray-400 font-mono animate-pulse">READY</span>
                  )}
                  {phase === "INSERT" && (
                    <span className="text-[11px] text-blue-400 font-mono">INSERTING...</span>
                  )}
                  {phase === "READING" && (
                    <span className="text-[11px] text-blue-400 font-mono animate-pulse">READING CARD...</span>
                  )}
                  {phase === "PROCESSING" && (
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="text-[11px] text-amber-400 font-mono">PROCESSING...</span>
                    </div>
                  )}
                  {phase === "PAID" && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-sm">✓</span>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">APPROVED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal details */}
              <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${phase === "READING" ? "bg-blue-400 animate-pulse" : phase === "PROCESSING" ? "bg-amber-400 animate-pulse" : phase === "PAID" ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <div className="w-2 h-2 rounded-full bg-gray-700" />
                  <div className="w-2 h-2 rounded-full bg-gray-700" />
                </div>
                <span className="text-[8px] text-gray-600 font-mono">NFC ENABLED</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
    </div>
  );
}

export default function VisaCardSection() {
  const sectionRef = useRef(null);
  const headingChoreographyRef = useHeadingReveal();
  const textRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current || !cardRef.current || !sectionRef.current) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const parallaxMult = isMobile ? 0.5 : 1;

    const ctx = gsap.context(() => {
      // Text reveals from the left — stagger individual text lines
      const textLines = textRef.current!.querySelectorAll('[data-text-line]');
      if (textLines.length > 0) {
        gsap.set(textLines, { opacity: 0.1, x: -30 });
        gsap.to(textLines, {
          opacity: 1,
          x: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });
      }

      // Card slides in from the right with rotation + glow bloom
      const cardBloom = cardRef.current!.querySelector('[data-card-bloom]') as HTMLElement;
      if (cardBloom) {
        gsap.set(cardBloom, { opacity: 0 });
      }
      gsap.set(cardRef.current, { opacity: 0.15, x: 60, rotateY: 15 });
      const cardTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      });
      cardTl.to(cardRef.current, {
        opacity: 1,
        x: 0,
        rotateY: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.15,
        force3D: true,
      });
      // Glow bloom on card during entrance
      if (cardBloom) {
        cardTl.to(cardBloom, {
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
        }, 0.3);
      }

      // Card parallax at 0.8x (slower — depth separation)
      gsap.to(cardRef.current, {
        y: -20 * parallaxMult,
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

      // Background glow at 0.2x (deep background)
      if (bgGlowRef.current) {
        gsap.to(bgGlowRef.current, {
          y: -8 * parallaxMult,
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

      // Divider glow drift
      if (dividerRef.current) {
        gsap.to(dividerRef.current, {
          x: 12 * parallaxMult,
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

      // Scroll-reactive glow
      const sectionEl = sectionRef.current as HTMLElement | null;
      const sectionGlows = sectionEl?.querySelectorAll('[data-section-glow]');
      sectionGlows?.forEach((glow) => {
        gsap.fromTo(glow, { opacity: 0.3 }, {
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: sectionEl, start: "top 80%", end: "top 30%", scrub: 0.5, invalidateOnRefresh: true },
        });
        gsap.to(glow, {
          opacity: 0.3,
          ease: "none",
          scrollTrigger: { trigger: sectionEl, start: "bottom 40%", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden">
      {/* Divider */}
      <div ref={dividerRef} data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#20aab6]/30 to-transparent" style={{ willChange: "transform" }} />

      <div ref={bgGlowRef} style={{ willChange: "transform" }}><CurrencyParticles /></div>

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div
            ref={textRef}
            className="text-center lg:text-left"
            style={{ willChange: "transform, opacity" }}
          >
            <p
              data-text-line
              className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-medium mb-4"
              style={{ willChange: "transform, opacity" }}
            >
              Now Available
            </p>
            <h2 data-text-line className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight" style={{ willChange: "transform, opacity" }}>
              <span className="text-white">
                Apply For Your Visa Rail Card
              </span>
            </h2>
            <p data-text-line className="mt-5 text-sm sm:text-base text-white/45 leading-relaxed max-w-md mx-auto lg:mx-0" style={{ willChange: "transform, opacity" }}>
              Converts cryptocurrency to cash. Use at ATM&apos;s to withdraw fiat
              or use as a credit card online and in person for daily liquidity
              convenience.
            </p>
            <motion.button
              data-text-line
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 btn-glow px-7 py-3 rounded-full text-sm font-semibold text-white"
              style={{ willChange: "transform, opacity" }}
            >
              Apply Now
            </motion.button>
          </div>

          {/* Right — 3D Card with Reader Animation */}
          <div ref={cardRef} style={{ willChange: "transform, opacity", perspective: "1000px" }}>
            <VisaCardWithAnimation />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgb(7,8,15))" }} />
    </section>
  );
}
