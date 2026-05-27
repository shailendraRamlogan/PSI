"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── Reduced motion detection ─── */
const reducedMotion = typeof window !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

/* ─── Card data ─── */
const cryptoCards = [
  {
    name: "Bitcoin", symbol: "BTC", number: "4716 •••• •••• 8392", holder: "BITCOIN CARD",
    bg: "from-[#1a1408] via-[#2a1f0a] to-[#0d0a04]", accent: "#F7931A",
    chipColor: "from-yellow-600 to-amber-700", glowColor: "rgba(247,147,26,0.12)",
    logoSrc: "/logos/btc.svg", value: 350,
  },
  {
    name: "Ethereum", symbol: "ETH", number: "5283 •••• •••• 1047", holder: "ETHEREUM CARD",
    bg: "from-[#0d0a1a] via-[#1a1030] to-[#080614]", accent: "#627EEA",
    chipColor: "from-purple-400 to-indigo-600", glowColor: "rgba(98,126,234,0.12)",
    logoSrc: "/logos/eth.svg", value: 500,
  },
  {
    name: "USDT", symbol: "USDT", number: "6011 •••• •••• 5523", holder: "TETHER CARD",
    bg: "from-[#041a14] via-[#082a1f] to-[#020d0a]", accent: "#26A17B",
    chipColor: "from-emerald-400 to-teal-600", glowColor: "rgba(38,161,123,0.12)",
    logoSrc: "/logos/usdt.svg", value: 250,
  },
  {
    name: "Tron", symbol: "TRX", number: "3742 •••• •••• 9081", holder: "TRON CARD",
    bg: "from-[#1a0408] via-[#2a0810] to-[#0d0204]", accent: "#EF0027",
    chipColor: "from-red-500 to-rose-700", glowColor: "rgba(239,0,39,0.12)",
    logoSrc: "/logos/trx.svg", value: 100,
  },
  {
    name: "USDC", symbol: "USDC", number: "4556 •••• •••• 3370", holder: "USDC CARD",
    bg: "from-[#04081a] via-[#081430] to-[#02040d]", accent: "#2775CA",
    chipColor: "from-blue-400 to-blue-700", glowColor: "rgba(39,117,202,0.12)",
    logoSrc: "/logos/usdc.svg", value: 300,
  },
  {
    name: "Trump", symbol: "TRUMP", number: "6331 •••• •••• 7744", holder: "TRUMP CARD",
    bg: "from-[#1a1008] via-[#0a1030] to-[#0d0804]", accent: "#C7A628",
    chipColor: "from-yellow-500 to-amber-600", glowColor: "rgba(199,166,40,0.12)",
    logoSrc: "/logos/trump.svg", value: 200,
  },
];

/* ─── Carousel Phase Types ─── */
type CarouselPhase = "BROWSE" | "SHUFFLE" | "SLOW_DOWN" | "LAND" | "HOLD" | "PIN_REVEAL" | "PIN_ENTRY" | "VERIFY" | "CONFIRM" | "REDEEM" | "REDEEM_HOLD" | "OUTRO" | "RESET";

const PHASE_DURATIONS: Record<CarouselPhase, number> = {
  BROWSE: 3000,
  SHUFFLE: 1500,
  SLOW_DOWN: 1000,
  LAND: 600,
  HOLD: 800,
  PIN_REVEAL: 500,
  PIN_ENTRY: 2000,
  VERIFY: 600,
  CONFIRM: 400,
  REDEEM: 2000,   // 500ms fade + 1500ms counter
  REDEEM_HOLD: 1500,
  OUTRO: 800,
  RESET: 500,
};

/* ─── easeOutQuart ─── */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/* ─── Format currency ─── */
function formatUSD(value: number): string {
  return `$${value.toFixed(2)}`;
}

/* ─── Single Card Component (unchanged) ─── */
function CryptoCard({ card, isHovered, onHover, onLeave, shimmerPos }: {
  card: typeof cryptoCards[0];
  isHovered: boolean;
  onHover: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLeave: () => void;
  shimmerPos: { x: number; y: number };
}) {
  return (
    <div className="relative" style={{ perspective: "800px" }}>
      <div className="absolute -inset-6 rounded-2xl blur-2xl transition-opacity duration-500"
        style={{ background: card.glowColor, opacity: isHovered ? 0.9 : 0.25 }} />
      <div className="absolute -inset-10 rounded-3xl blur-[40px] transition-opacity duration-700"
        style={{ background: card.glowColor.replace('0.12', '0.06'), opacity: isHovered ? 0.6 : 0.15 }} />
      <div className="absolute -inset-2 rounded-xl"
        style={{ boxShadow: isHovered
          ? `0 20px 40px -8px rgba(0,0,0,0.5), 0 0 30px ${card.accent}20`
          : `0 8px 24px -4px rgba(0,0,0,0.3), 0 0 12px ${card.accent}08` }} />

      <div
        onMouseMove={onHover} onMouseEnter={onHover} onMouseLeave={onLeave}
        className="relative w-[200px] sm:w-[240px] h-[126px] sm:h-[152px] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300"
        style={{ transformStyle: "preserve-3d", transform: isHovered ? "scale(1.06) translateY(-8px)" : "none" }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${card.bg}`} />
        <div className="absolute inset-0 transition-all duration-300"
          style={{ background: `radial-gradient(circle at ${shimmerPos.x}% ${shimmerPos.y}%, rgba(255,255,255,0.06), transparent 60%)` }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 9px)" }} />

        <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
          <div className="w-[70px] h-[70px] sm:w-[85px] sm:h-[85px] relative transition-all duration-500"
            style={{
              opacity: isHovered ? 0.8 : 0.45,
              filter: isHovered ? `drop-shadow(0 0 10px ${card.accent}40)` : `drop-shadow(0 0 4px ${card.accent}15)`,
            }}>
            <img src={card.logoSrc} alt="" className="absolute inset-0 w-full h-full scale-105 blur-[1px]" style={{ opacity: 0.2 }} draggable={false} />
            <img src={card.logoSrc} alt={`${card.name} logo`} className="w-full h-full relative" draggable={false} />
          </div>
        </div>

        <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className={`w-7 h-5 sm:w-8 sm:h-6 rounded-[3px] bg-gradient-to-br ${card.chipColor} border border-white/10 relative overflow-hidden`}>
              <div className="absolute inset-x-1.5 top-1/2 h-[0.5px] bg-black/20" />
              <div className="absolute inset-y-1 left-1/2 w-[0.5px] bg-black/20" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-base sm:text-lg font-black tracking-tighter" style={{ color: card.accent }}>{card.symbol}</span>
              <span className="text-[6px] sm:text-[7px] text-white/25 uppercase tracking-widest font-medium -mt-0.5">{card.name}</span>
            </div>
          </div>
          <div>
            <p className="text-white/50 text-[9px] sm:text-[10px] font-mono tracking-[0.1em] mb-1">{card.number}</p>
            <div className="flex items-end justify-between">
              <p className="text-[6px] sm:text-[7px] text-white/30 uppercase tracking-[0.12em] font-medium">{card.holder}</p>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[5px] sm:text-[6px] font-bold text-white/60 border"
                style={{ borderColor: `${card.accent}33`, background: `${card.accent}11` }}>PSI</div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.02) 55%, transparent 65%)", backgroundSize: "250% 100%" }} />
        <div className="absolute inset-0 rounded-lg border border-white/[0.08] pointer-events-none" />
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${card.accent}30, rgba(255,255,255,0.08), ${card.accent}30, transparent)` }} />
        <div className="absolute top-[10%] bottom-[20%] left-0 w-[1px] pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${card.accent}25, transparent, rgba(255,255,255,0.06), transparent)` }} />
        <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${card.accent}40, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[150%] h-full opacity-[0.04]"
            style={{ background: "conic-gradient(from 200deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Card Back Face ─── */
function CardBack() {
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0a12 0%, #12121f 50%, #0a0a12 100%)",
        transform: "rotateY(180deg)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* PSI watermark pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 24px,
            rgba(255,255,255,0.08) 24px,
            rgba(255,255,255,0.08) 25px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 24px,
            rgba(255,255,255,0.08) 24px,
            rgba(255,255,255,0.08) 25px
          )`,
        }}
      />
      {/* Center PSI logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center">
          <span className="text-white/20 text-sm sm:text-base font-bold tracking-widest">PSI</span>
        </div>
      </div>
      {/* Magnetic stripe */}
      <div className="absolute top-[30%] left-0 right-0 h-[18px] bg-gradient-to-r from-[#1a1a2e] via-[#22223a] to-[#1a1a2e]" />
      <div className="absolute inset-0 rounded-lg border border-white/[0.06] pointer-events-none" />
    </div>
  );
}

/* ─── PIN Pad Overlay ─── */
function PinPadOverlay({ card, phase, pinDigits, enteredCount }: {
  card: typeof cryptoCards[0];
  phase: CarouselPhase;
  pinDigits: number[];
  enteredCount: number;
}) {
  const padKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "✱", "0", "#"];
  const showCheckmark = phase === "CONFIRM";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-20 rounded-lg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          backdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.75)",
        }}
      >
        {/* Dot indicators */}
        <div style={{ display: "flex", margin: 0, padding: "4px 0", gap: "8px" }}>
          {[0, 1, 2, 3].map((i) => {
            const filled = i < enteredCount;
            const isConfirmed = phase === "CONFIRM";
            const isVerifying = phase === "VERIFY";
            return (
              <motion.span
                key={i}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  display: "inline-block",
                  background: filled
                    ? (isConfirmed ? "#34d399" : card.accent)
                    : "rgba(255,255,255,0.25)",
                }}
                animate={{
                  scale: filled && enteredCount === i + 1 && phase === "PIN_ENTRY" ? [1, 1.2, 1] : isVerifying ? [1, 1.15, 1] : 1,
                }}
                transition={filled && enteredCount === i + 1 ? { duration: 0.3, ease: "easeOut" } : isVerifying ? { duration: 0.4, repeat: 1, ease: "easeInOut" } : {}}
              />
            );
          })}
        </div>

        {/* Number grid — fills remaining space proportionally */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: "6px",
          width: "100%",
          flex: 1,
          minHeight: 0,
        }}>
          {padKeys.map((key, ki) => {
            const isHighlighted = phase === "PIN_ENTRY" && enteredCount > 0 && key === String(pinDigits[enteredCount - 1]);
            return (
              <motion.div
                key={ki}
                className="font-mono flex items-center justify-center"
                style={{
                  height: "100%",
                  width: "100%",
                  fontSize: "16px",
                  borderRadius: "8px",
                  minHeight: 0,
                  background: isHighlighted ? `${card.accent}30` : "rgba(255,255,255,0.06)",
                  color: isHighlighted ? card.accent : "rgba(255,255,255,0.4)",
                  border: `1px solid ${isHighlighted ? `${card.accent}50` : "rgba(255,255,255,0.08)"}`,
                  transition: "all 0.15s ease",
                }}
                animate={isHighlighted ? { scale: [1, 0.9, 1] } : {}}
                transition={{ duration: 0.2 }}
              >
                {key}
              </motion.div>
            );
          })}
        </div>

        {/* Verify spinner */}
        {phase === "VERIFY" && enteredCount === 4 && (
          <div style={{ height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "16px", height: "16px", border: "2px solid", borderRadius: "50%", borderColor: `${card.accent}40`, borderTopColor: card.accent, animation: "pinSpin 0.6s linear infinite" }} />
          </div>
        )}

        {/* Confirm checkmark */}
        {showCheckmark && (
          <div style={{ height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#34d399" strokeWidth="1.5" fill="rgba(52,211,153,0.1)" />
              <path d="M6 10.5L9 13.5L14 7.5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Redemption Panel Overlay ─── */
function RedemptionOverlay({ card, phase }: {
  card: typeof cryptoCards[0];
  phase: CarouselPhase;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const counterDuration = 1500;

  useEffect(() => {
    // Only reset counter when we're completely outside the redeem flow
    if (phase !== "REDEEM" && phase !== "REDEEM_HOLD") {
      setDisplayValue(0);
      return;
    }

    // Start counter only on REDEEM phase
    if (phase !== "REDEEM") return;

    // 500ms fade-in delay, then start counter
    const delayTimeout = setTimeout(() => {
      startTimeRef.current = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / counterDuration, 1);
        const easedProgress = easeOutQuart(progress);

        // Clamp final value to exact target
        if (progress >= 1) {
          setDisplayValue(card.value);
          return;
        }

        setDisplayValue(easedProgress * card.value);
        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(delayTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, card.value]);

  const isRedeemPhase = phase === "REDEEM" || phase === "REDEEM_HOLD";
  const isOutro = phase === "OUTRO";

  return (
    <AnimatePresence>
      {isRedeemPhase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-20 rounded-lg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            boxSizing: "border-box",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(4px)",
            background: "rgba(0,0,0,0.8)",
            boxShadow: phase === "REDEEM" && displayValue > 0
              ? "0 0 40px rgba(52,211,153,0.3), 0 0 80px rgba(52,211,153,0.15)"
              : "none",
            transition: "box-shadow 0.3s ease",
          }}
        >
          {/* Crypto logo */}
          <div style={{ maxHeight: "20%", width: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={card.logoSrc} alt={card.name} style={{ maxHeight: "100%", width: "auto", objectFit: "contain" as const }} draggable={false} />
          </div>

          {/* REDEEMED label */}
          <span style={{ fontSize: "11px", letterSpacing: "0.15em", margin: 0, fontWeight: "bold", textTransform: "uppercase", color: card.accent }}>
            Redeemed
          </span>

          {/* Animated counter */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="font-bold text-white font-mono tabular-nums"
            style={{ fontSize: "clamp(20px, 3vw, 32px)", margin: 0 }}
          >
            {formatUSD(displayValue)}
          </motion.div>

          {/* Symbol */}
          <span style={{ fontSize: "11px", margin: 0, color: "rgba(255,255,255,0.4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {card.symbol}
          </span>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
            style={{ fontSize: "11px", marginTop: "4px", color: "rgba(52,211,153,0.6)" }}
          >
            Added to your wallet
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Mobile Card (85vw, max 340px, 180px tall) ─── */
function MobileCryptoCard({ card }: { card: typeof cryptoCards[0] }) {
  return (
    <div className="relative w-[85vw] max-w-[340px] h-[180px] rounded-lg overflow-hidden" style={{ perspective: "800px" }}>
      <div className={`absolute inset-0 bg-gradient-to-br ${card.bg}`} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 9px)" }} />
      {/* Logo watermark */}
      <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
        <div className="w-[70px] h-[70px] relative" style={{ opacity: 0.45, filter: `drop-shadow(0 0 4px ${card.accent}15)` }}>
          <img src={card.logoSrc} alt="" className="absolute inset-0 w-full h-full scale-105 blur-[1px]" style={{ opacity: 0.2 }} draggable={false} />
          <img src={card.logoSrc} alt={`${card.name} logo`} className="w-full h-full relative" draggable={false} />
        </div>
      </div>
      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className={`w-7 h-5 rounded-[3px] bg-gradient-to-br ${card.chipColor} border border-white/10 relative overflow-hidden`}>
            <div className="absolute inset-x-1.5 top-1/2 h-[0.5px] bg-black/20" />
            <div className="absolute inset-y-1 left-1/2 w-[0.5px] bg-black/20" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-base font-black tracking-tighter" style={{ color: card.accent }}>{card.symbol}</span>
            <span className="text-[6px] text-white/25 uppercase tracking-widest font-medium -mt-0.5">{card.name}</span>
          </div>
        </div>
        <div>
          <p className="text-white/50 text-[10px] font-mono tracking-[0.1em] mb-1">{card.number}</p>
          <div className="flex items-end justify-between">
            <p className="text-[7px] text-white/30 uppercase tracking-[0.12em] font-medium">{card.holder}</p>
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[5px] font-bold text-white/60 border"
              style={{ borderColor: `${card.accent}33`, background: `${card.accent}11` }}>PSI</div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 rounded-lg border border-white/[0.08] pointer-events-none" />
      <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${card.accent}40, transparent)` }} />
    </div>
  );
}

/* ─── Mobile Card Back ─── */
function MobileCardBack() {
  return (
    <div className="absolute inset-0 w-[85vw] max-w-[340px] h-[180px] rounded-lg overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a12 0%, #12121f 50%, #0a0a12 100%)", transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
    >
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.08) 24px, rgba(255,255,255,0.08) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.08) 24px, rgba(255,255,255,0.08) 25px)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
          <span className="text-white/20 text-sm font-bold tracking-widest">PSI</span>
        </div>
      </div>
      <div className="absolute top-[30%] left-0 right-0 h-[18px] bg-gradient-to-r from-[#1a1a2e] via-[#22223a] to-[#1a1a2e]" />
      <div className="absolute inset-0 rounded-lg border border-white/[0.06] pointer-events-none" />
    </div>
  );
}

/* ─── Mobile PIN Pad Overlay ─── */
function MobilePinPadOverlay({ card, phase, pinDigits, enteredCount }: {
  card: typeof cryptoCards[0];
  phase: CarouselPhase;
  pinDigits: number[];
  enteredCount: number;
}) {
  const padKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "✱", "0", "#"];
  const showCheckmark = phase === "CONFIRM";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-20 rounded-lg"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "10px",
          backdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.8)",
        }}
      >
        {/* Dot indicators row */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
          {[0, 1, 2, 3].map((i) => {
            const filled = i < enteredCount;
            const isConfirmed = phase === "CONFIRM";
            const isVerifying = phase === "VERIFY";
            return (
              <motion.span
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  display: "inline-block",
                  background: filled
                    ? (isConfirmed ? "#34d399" : card.accent)
                    : "rgba(255,255,255,0.25)",
                }}
                animate={{
                  scale: filled && enteredCount === i + 1 && phase === "PIN_ENTRY" ? [1, 1.2, 1] : isVerifying ? [1, 1.15, 1] : 1,
                }}
                transition={filled && enteredCount === i + 1 ? { duration: 0.3, ease: "easeOut" } : isVerifying ? { duration: 0.4, repeat: 1, ease: "easeInOut" } : {}}
              />
            );
          })}
        </div>

        {/* Number grid — proportional, fits within card bounds */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "4px",
          width: "100%",
          flex: 1,
        }}>
          {padKeys.map((key, ki) => {
            const isHighlighted = phase === "PIN_ENTRY" && enteredCount > 0 && key === String(pinDigits[enteredCount - 1]);
            return (
              <motion.div
                key={ki}
                className="font-mono"
                style={{
                    height: 0,
                    paddingBottom: "22%",
                    position: "relative",
                    fontSize: "14px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isHighlighted ? `${card.accent}30` : "rgba(255,255,255,0.06)",
                    color: isHighlighted ? card.accent : "rgba(255,255,255,0.4)",
                    border: `1px solid ${isHighlighted ? `${card.accent}50` : "rgba(255,255,255,0.08)"}`,
                    transition: "all 0.15s ease",
                }}
                animate={isHighlighted ? { scale: [1, 0.9, 1] } : {}}
                transition={{ duration: 0.2 }}
              >
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{key}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Verify spinner */}
        {phase === "VERIFY" && enteredCount === 4 && (
          <div style={{ marginTop: "6px" }}>
            <div style={{ width: "16px", height: "16px", border: "2px solid", borderRadius: "50%", borderColor: `${card.accent}40`, borderTopColor: card.accent, animation: "pinSpin 0.6s linear infinite" }} />
          </div>
        )}

        {/* Confirm checkmark */}
        {showCheckmark && (
          <div style={{ marginTop: "6px" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#34d399" strokeWidth="1.5" fill="rgba(52,211,153,0.1)" />
              <path d="M6 10.5L9 13.5L14 7.5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Mobile Redemption Overlay ─── */
function MobileRedemptionOverlay({ card, phase }: {
  card: typeof cryptoCards[0];
  phase: CarouselPhase;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const counterDuration = 1500;

  useEffect(() => {
    // Only reset counter when we're completely outside the redeem flow
    if (phase !== "REDEEM" && phase !== "REDEEM_HOLD") { setDisplayValue(0); return; }

    // Start counter only on REDEEM phase
    if (phase !== "REDEEM") return;

    const delayTimeout = setTimeout(() => {
      startTimeRef.current = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / counterDuration, 1);
        const easedProgress = easeOutQuart(progress);

        // Clamp final value to exact target
        if (progress >= 1) {
          setDisplayValue(card.value);
          return;
        }

        setDisplayValue(easedProgress * card.value);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, 500);
    return () => { clearTimeout(delayTimeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, card.value]);

  const isRedeemPhase = phase === "REDEEM" || phase === "REDEEM_HOLD";

  return (
    <AnimatePresence>
      {isRedeemPhase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-20 rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            backdropFilter: "blur(4px)",
            background: "rgba(0,0,0,0.8)",
            boxShadow: phase === "REDEEM" && displayValue > 0 ? "0 0 40px rgba(52,211,153,0.3), 0 0 80px rgba(52,211,153,0.15)" : "none",
            transition: "box-shadow 0.3s ease",
            width: "100%", height: "100%",
          }}
        >
          <div className="flex flex-col items-center gap-1.5 p-5">
            <div className="w-11 h-11 mt-3" style={{ maxWidth: "44px" }}>
              <img src={card.logoSrc} alt={card.name} className="w-full h-full" draggable={false} />
            </div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: card.accent }}>Redeemed</span>
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.3 }}
              className="font-bold text-white font-mono tabular-nums"
              style={{ fontSize: "clamp(22px, 6vw, 36px)" }}
            >
              {formatUSD(displayValue)}
            </motion.div>
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{card.symbol}</span>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.3 }}
              className="text-[11px] text-emerald-400/60 mb-3"
            >
              Added to your wallet
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Animated Carousel ─── */
function AnimatedCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-100px" });
  const hasStartedRef = useRef(false);
  const centeredRef = useRef(false);

  const [phase, setPhase] = useState<CarouselPhase>("BROWSE");
  const [focusIndex, setFocusIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [pinDigits, setPinDigits] = useState<number[]>([]);
  const [enteredCount, setEnteredCount] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // Browse phase: auto-advance focus every 1s for 3 seconds
  useEffect(() => {
    if (!isInView && !hasStartedRef.current) return;
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
    }

    if (phase === "BROWSE") {
      const browseInterval = setInterval(() => {
        setFocusIndex((prev) => (prev + 1) % cryptoCards.length);
      }, 1000);

      const browseTimeout = setTimeout(() => {
        clearInterval(browseInterval);
        const randomIdx = Math.floor(Math.random() * cryptoCards.length);
        setSelectedIndex(randomIdx);
        if (reducedMotion) {
          setPhase("LAND");
        } else {
          setPhase("SHUFFLE");
        }
      }, PHASE_DURATIONS.BROWSE);

      return () => {
        clearInterval(browseInterval);
        clearTimeout(browseTimeout);
      };
    }
  }, [phase, isInView]);

  // Shuffle phase
  useEffect(() => {
    if (phase !== "SHUFFLE") return;
    let offset = 0;
    const shuffleInterval = setInterval(() => {
      offset += 260;
      setShuffleOffset(offset);
    }, 80);
    const shuffleTimeout = setTimeout(() => {
      clearInterval(shuffleInterval);
      setPhase("SLOW_DOWN");
    }, PHASE_DURATIONS.SHUFFLE);
    return () => { clearInterval(shuffleInterval); clearTimeout(shuffleTimeout); };
  }, [phase]);

  // Slow down
  useEffect(() => {
    if (phase !== "SLOW_DOWN") return;
    const timeout = setTimeout(() => setPhase("LAND"), PHASE_DURATIONS.SLOW_DOWN);
    return () => clearTimeout(timeout);
  }, [phase]);

  // Center selected card on desktop track during LAND phase
  useEffect(() => {
    if (phase !== "LAND" || selectedIndex < 0 || !desktopTrackRef.current || !containerRef.current) return;

    const track = desktopTrackRef.current;
    const cards = track.children;
    if (!cards[selectedIndex]) return;

    const containerRect = track.parentElement!.getBoundingClientRect();
    const cardEl = cards[selectedIndex] as HTMLElement;
    const cardRect = cardEl.getBoundingClientRect();

    const containerCenter = containerRect.width / 2;
    const cardCenter = cardRect.left - containerRect.left + cardRect.width / 2;
    const translateX = containerCenter - cardCenter;

    track.style.transition = 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = `translateX(${translateX}px)`;
    centeredRef.current = true;
  }, [phase, selectedIndex]);

  // Land → HOLD (wait for centering animation to finish first)
  useEffect(() => {
    if (phase !== "LAND") return;
    const timeout = setTimeout(() => setPhase("HOLD"), 650);
    return () => clearTimeout(timeout);
  }, [phase]);

  // Hold → PIN_REVEAL
  useEffect(() => {
    if (phase !== "HOLD") return;
    const timeout = setTimeout(() => {
      const digits = [
        Math.floor(Math.random() * 9) + 1,
        Math.floor(Math.random() * 9) + 1,
        Math.floor(Math.random() * 9) + 1,
        Math.floor(Math.random() * 9) + 1,
      ];
      setPinDigits(digits);
      setEnteredCount(0);
      setPhase("PIN_REVEAL");
    }, PHASE_DURATIONS.HOLD);
    return () => clearTimeout(timeout);
  }, [phase]);

  // PIN_REVEAL → PIN_ENTRY
  useEffect(() => {
    if (phase !== "PIN_REVEAL") return;
    const timeout = setTimeout(() => setPhase("PIN_ENTRY"), PHASE_DURATIONS.PIN_REVEAL);
    return () => clearTimeout(timeout);
  }, [phase]);

  // PIN_ENTRY: auto-type digits
  useEffect(() => {
    if (phase !== "PIN_ENTRY") return;
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < 4; i++) {
      timers.push(setTimeout(() => { setEnteredCount(i + 1); }, 400 * (i + 1)));
    }
    const verifyTimeout = setTimeout(() => { setPhase("VERIFY"); }, 400 * 4 + 200);
    return () => { timers.forEach(clearTimeout); clearTimeout(verifyTimeout); };
  }, [phase]);

  // VERIFY → CONFIRM
  useEffect(() => {
    if (phase !== "VERIFY") return;
    const timeout = setTimeout(() => setPhase("CONFIRM"), PHASE_DURATIONS.VERIFY);
    return () => clearTimeout(timeout);
  }, [phase]);

  // CONFIRM → REDEEM
  useEffect(() => {
    if (phase !== "CONFIRM") return;
    const timeout = setTimeout(() => setPhase("REDEEM"), PHASE_DURATIONS.CONFIRM);
    return () => clearTimeout(timeout);
  }, [phase]);

  // REDEEM → REDEEM_HOLD
  useEffect(() => {
    if (phase !== "REDEEM") return;
    const timeout = setTimeout(() => setPhase("REDEEM_HOLD"), PHASE_DURATIONS.REDEEM);
    return () => clearTimeout(timeout);
  }, [phase]);

  // REDEEM_HOLD → OUTRO
  useEffect(() => {
    if (phase !== "REDEEM_HOLD") return;
    const timeout = setTimeout(() => setPhase("OUTRO"), PHASE_DURATIONS.REDEEM_HOLD);
    return () => clearTimeout(timeout);
  }, [phase]);

  // OUTRO → flip card, then RESET
  useEffect(() => {
    if (phase !== "OUTRO") return;
    // Flip to back after a moment
    const flipTimeout = setTimeout(() => { setShowBack(true); }, 200);
    const resetTimeout = setTimeout(() => setPhase("RESET"), PHASE_DURATIONS.OUTRO);
    return () => { clearTimeout(flipTimeout); clearTimeout(resetTimeout); };
  }, [phase]);

  // RESET → BROWSE
  useEffect(() => {
    if (phase !== "RESET") return;

    // Reset desktop track transform
    if (desktopTrackRef.current) {
      desktopTrackRef.current.style.transition = 'transform 500ms ease-out';
      desktopTrackRef.current.style.transform = 'translateX(0)';
    }
    centeredRef.current = false;

    const timeout = setTimeout(() => {
      setSelectedIndex(-1);
      setFocusIndex(0);
      setShuffleOffset(0);
      setPinDigits([]);
      setEnteredCount(0);
      setShowBack(false);
      setPhase("BROWSE");
    }, PHASE_DURATIONS.RESET);
    return () => clearTimeout(timeout);
  }, [phase]);

  // Initial trigger
  useEffect(() => {
    if (isInView && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setPhase("BROWSE");
    }
  }, [isInView]);

  // Mobile: detect PIN or redemption phases for overflow/height adjustments
  const isPinOrRedeem = phase === "PIN_REVEAL" || phase === "PIN_ENTRY" || phase === "VERIFY" || phase === "CONFIRM" || phase === "REDEEM" || phase === "REDEEM_HOLD";

  // Compute card styles based on phase
  const getCardStyle = (index: number): React.CSSProperties => {
    const card = cryptoCards[index];
    const isFocused = index === focusIndex;
    const isSelected = index === selectedIndex;

    // Centered phases: selected card center, others away
    const isCenteredPhase = phase === "LAND" || phase === "HOLD" ||
      phase === "PIN_REVEAL" || phase === "PIN_ENTRY" || phase === "VERIFY" || phase === "CONFIRM" ||
      phase === "REDEEM" || phase === "REDEEM_HOLD";

    if (isCenteredPhase && selectedIndex >= 0) {
      if (isSelected) {
        return {
          transform: "scale(1) translateY(0)",
          opacity: 1,
          zIndex: 10,
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          filter: "none",
          boxShadow: `0 0 30px ${card.accent}40, 0 0 60px ${card.accent}20`,
          border: `2px solid ${card.accent}`,
          borderRadius: "0.5rem",
        };
      }
      return {
        transform: "scale(0.7) translateY(0)",
        opacity: 0.2,
        zIndex: 1,
        transition: "all 0.6s ease-out",
        filter: "blur(2px)",
        pointerEvents: "none",
      };
    }

    // OUTRO: card flipping, others reforming
    if (phase === "OUTRO" && selectedIndex >= 0) {
      if (isSelected) {
        return {
          transform: showBack ? "rotateY(180deg)" : "rotateY(90deg)",
          opacity: showBack ? 1 : 0.5,
          zIndex: 10,
          transition: `transform 0.6s ${showBack ? "ease-out" : "ease-in"}`,
          perspective: "800px",
          transformStyle: "preserve-3d",
        };
      }
      return {
        transform: "scale(0.85) translateY(0)",
        opacity: 0.4,
        zIndex: 1,
        transition: "all 0.6s ease-out",
        filter: "blur(0px)",
      };
    }

    // RESET: all cards reforming
    if (phase === "RESET") {
      return {
        transform: "scale(0.85) rotateY(15deg) translateY(0)",
        opacity: 0.6,
        zIndex: 1,
        transition: "all 0.5s ease-out",
      };
    }

    // SHUFFLE
    if (phase === "SHUFFLE") {
      return {
        transform: `translateX(${(shuffleOffset % (260 * cryptoCards.length))}px)`,
        filter: "blur(2px)",
        opacity: 0.7,
        transition: "transform 0.08s linear",
        zIndex: 1,
      };
    }

    // SLOW_DOWN
    if (phase === "SLOW_DOWN") {
      return {
        transform: `translateX(${(shuffleOffset % (260 * cryptoCards.length)) * 0.3}px)`,
        filter: "blur(0px)",
        opacity: 0.8,
        transition: "all 1s ease-out",
        zIndex: 1,
      };
    }

    // BROWSE
    if (isFocused) {
      return { transform: "scale(1) translateY(0)", opacity: 1, zIndex: 5, transition: "all 0.4s ease-out" };
    }
    return { transform: "scale(0.85) rotateY(15deg) translateY(0)", opacity: 0.6, zIndex: 1, transition: "all 0.4s ease-out" };
  };

  // Determine which overlay to show on selected card
  const getOverlay = (index: number) => {
    if (index !== selectedIndex) return null;

    if (phase === "PIN_REVEAL" || phase === "PIN_ENTRY" || phase === "VERIFY" || phase === "CONFIRM") {
      return <PinPadOverlay card={cryptoCards[index]} phase={phase} pinDigits={pinDigits} enteredCount={enteredCount} />;
    }
    if (phase === "REDEEM" || phase === "REDEEM_HOLD") {
      return <RedemptionOverlay card={cryptoCards[index]} phase={phase} />;
    }
    return null;
  };

  // Should we show the card back?
  const shouldShowBack = (index: number) => {
    return index === selectedIndex && showBack;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop carousel */}
      <div className="hidden sm:block">
        <div className="relative mx-auto overflow-hidden" style={{ width: "1040px", height: "230px" }}>
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1100px] h-[350px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(108,99,255,0.08) 0%, rgba(88,70,200,0.035) 35%, transparent 60%)" }} />

          <div ref={desktopTrackRef} className="absolute inset-0 flex items-center justify-center gap-6">
            {cryptoCards.map((card, i) => (
              <div
                key={card.symbol}
                className="flex-shrink-0 relative"
                style={{
                  ...getCardStyle(i),
                  transformStyle: "preserve-3d",
                  perspective: "800px",
                }}
              >
                <div style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}>
                  <CryptoCard
                    card={card}
                    isHovered={phase === "BROWSE" && i === focusIndex}
                    onHover={() => {}}
                    onLeave={() => {}}
                    shimmerPos={{ x: 50, y: 50 }}
                  />
                </div>
                {shouldShowBack(i) && <CardBack />}
                {getOverlay(i)}
              </div>
            ))}
          </div>

          <div className="absolute inset-y-0 left-0 w-[120px] pointer-events-none z-[10]"
            style={{ background: "linear-gradient(to right, rgb(7,8,15), transparent)" }} />
          <div className="absolute inset-y-0 right-0 w-[120px] pointer-events-none z-[10]"
            style={{ background: "linear-gradient(to left, rgb(7,8,15), transparent)" }} />

          {/* Glow burst */}
          <AnimatePresence>
            {(phase === "LAND" || phase === "HOLD" || phase === "PIN_REVEAL" || phase === "PIN_ENTRY" || phase === "VERIFY" || phase === "CONFIRM" || phase === "REDEEM" || phase === "REDEEM_HOLD") && selectedIndex >= 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] rounded-2xl pointer-events-none"
                style={{
                  background: phase === "REDEEM" || phase === "REDEEM_HOLD"
                    ? "radial-gradient(ellipse, rgba(52,211,153,0.2) 0%, transparent 70%)"
                    : `radial-gradient(ellipse, ${cryptoCards[selectedIndex].accent}25 0%, transparent 70%)`,
                  filter: "blur(30px)",
                }}
              />
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[25px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, rgba(108,99,255,0.03) 50%, transparent 70%)", filter: "blur(8px)" }} />
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden overflow-x-hidden" style={{ width: "100%" }}>
        <div
          ref={mobileContainerRef}
          className="relative mx-auto flex items-center justify-center"
          style={{ height: "220px", width: "100%", overflow: "hidden", touchAction: phase === "BROWSE" ? "pan-y" : "none" }}
          onTouchStart={(e) => {
            if (phase !== "BROWSE") return;
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (phase !== "BROWSE" || !touchStartRef.current) return;
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            if (Math.abs(dx) > 50) {
              setFocusIndex((prev) => {
                if (dx < 0) return (prev + 1) % cryptoCards.length;
                return (prev - 1 + cryptoCards.length) % cryptoCards.length;
              });
            }
            touchStartRef.current = null;
          }}
        >
          {/* Only show focused/selected card on mobile */}
          {cryptoCards.map((card, i) => {
            const isFocused = i === focusIndex;
            const isSelected = i === selectedIndex;
            const isVisible = isFocused || isSelected;

            // Mobile card style
            let mobileStyle: React.CSSProperties = {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: 0,
              pointerEvents: "none",
              transition: "all 0.4s ease-out",
              transformStyle: "preserve-3d",
              perspective: "800px",
              zIndex: 1,
            };

            // BROWSE: show only focused card
            if (phase === "BROWSE") {
              if (isFocused) {
                mobileStyle = {
                  ...mobileStyle,
                  opacity: 1,
                  pointerEvents: "auto",
                  zIndex: 5,
                };
              }
            }

            // SHUFFLE: flip the focused card rapidly
            else if (phase === "SHUFFLE") {
              if (isFocused) {
                const rotDeg = (shuffleOffset * 3) % 360;
                mobileStyle = {
                  ...mobileStyle,
                  opacity: 0.7,
                  transform: `translate(-50%, -50%) rotateY(${rotDeg}deg)`,
                  filter: "blur(2px)",
                  transition: "transform 0.08s linear",
                  zIndex: 5,
                };
              }
            }

            // SLOW_DOWN: decelerate flip
            else if (phase === "SLOW_DOWN") {
              if (isFocused) {
                const rotDeg = (shuffleOffset * 0.9) % 360;
                mobileStyle = {
                  ...mobileStyle,
                  opacity: 0.9,
                  transform: `translate(-50%, -50%) rotateY(${rotDeg}deg)`,
                  filter: "blur(0px)",
                  transition: "all 1s ease-out",
                  zIndex: 5,
                };
              }
            }

            // LAND / HOLD / PIN phases / REDEEM phases: selected card centered
            else if (
              (phase === "LAND" || phase === "HOLD" || phase === "PIN_REVEAL" || phase === "PIN_ENTRY" ||
               phase === "VERIFY" || phase === "CONFIRM" || phase === "REDEEM" || phase === "REDEEM_HOLD") &&
              selectedIndex >= 0
            ) {
              if (isSelected) {
                mobileStyle = {
                  ...mobileStyle,
                  opacity: 1,
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                  transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  boxShadow: `0 0 30px ${card.accent}40, 0 0 60px ${card.accent}20`,
                  border: `2px solid ${card.accent}`,
                  borderRadius: "0.5rem",
                  pointerEvents: "auto",
                };
              }
            }

            // OUTRO: flip to back
            else if (phase === "OUTRO" && selectedIndex >= 0) {
              if (isSelected) {
                mobileStyle = {
                  ...mobileStyle,
                  opacity: showBack ? 1 : 0.5,
                  transform: showBack ? "translate(-50%, -50%) rotateY(180deg)" : "translate(-50%, -50%) rotateY(90deg)",
                  zIndex: 10,
                  transition: `transform 0.6s ${showBack ? "ease-out" : "ease-in"}`,
                  transformStyle: "preserve-3d",
                  pointerEvents: "none",
                };
              }
            }

            // RESET: fading back in
            else if (phase === "RESET") {
              if (isFocused) {
                mobileStyle = {
                  ...mobileStyle,
                  opacity: 0.6,
                  transform: "translate(-50%, -50%)",
                  zIndex: 1,
                  transition: "all 0.5s ease-out",
                };
              }
            }

            return (
              <div key={card.symbol} style={mobileStyle}>
                <div style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}>
                  <MobileCryptoCard card={card} />
                </div>
                {shouldShowBack(i) && <MobileCardBack />}
                {/* Mobile overlays */}
                {isSelected && (phase === "PIN_REVEAL" || phase === "PIN_ENTRY" || phase === "VERIFY" || phase === "CONFIRM") && (
                  <MobilePinPadOverlay card={card} phase={phase} pinDigits={pinDigits} enteredCount={enteredCount} />
                )}
                {isSelected && (phase === "REDEEM" || phase === "REDEEM_HOLD") && (
                  <MobileRedemptionOverlay card={card} phase={phase} />
                )}
              </div>
            );
          })}

          {/* Mobile glow burst */}
          <AnimatePresence>
            {(phase === "LAND" || phase === "HOLD" || phase === "PIN_REVEAL" || phase === "PIN_ENTRY" || phase === "VERIFY" || phase === "CONFIRM" || phase === "REDEEM" || phase === "REDEEM_HOLD") && selectedIndex >= 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[180px] rounded-2xl pointer-events-none"
                style={{
                  background: phase === "REDEEM" || phase === "REDEEM_HOLD"
                    ? "radial-gradient(ellipse, rgba(52,211,153,0.2) 0%, transparent 70%)"
                    : `radial-gradient(ellipse, ${cryptoCards[selectedIndex].accent}25 0%, transparent 70%)`,
                  filter: "blur(30px)",
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section ─── */
export default function GiftCardsSection() {
  const sectionRef = useRef(null);
  const headingChoreographyRef = useHeadingReveal();
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bloomRef = useRef<HTMLDivElement>(null);
  const warmBloomRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const parallaxMult = isMobile ? 0.5 : 1;

    const ctx = gsap.context(() => {
      if (dustRef.current) {
        const particles = dustRef.current.querySelectorAll('[data-particle]');
        if (particles.length > 0) {
          gsap.set(particles, { opacity: 0, scale: 0.5 });
          gsap.to(particles, { opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: "power2.out", force3D: true,
            scrollTrigger: { trigger: sectionRef.current, start: "top 75%", toggleActions: "play none none none", invalidateOnRefresh: true },
          });
        }
      }

      glowRefs.current.forEach((glow) => {
        if (!glow) return;
        gsap.set(glow, { opacity: 0.3 });
        gsap.to(glow, { opacity: 1, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%", end: "top 30%", scrub: 0.5, invalidateOnRefresh: true },
        });
      });

      if (!isMobile) {
        [bloomRef.current, warmBloomRef.current].forEach((el, i) => {
          if (!el) return;
          gsap.to(el, { x: 10 * Math.cos(i * 2.1), y: 6 * Math.sin(i * 1.7), ease: "none", force3D: true,
            scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
          });
        });
      }

      if (dustRef.current) {
        gsap.to(dustRef.current, { y: -10 * parallaxMult, ease: "none", force3D: true,
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
        });
      }

      const sectionEl = sectionRef.current as HTMLElement | null;
      const sectionGlows = sectionEl?.querySelectorAll('[data-section-glow]');
      sectionGlows?.forEach((glow) => {
        gsap.fromTo(glow, { opacity: 0.3 }, { opacity: 1, ease: "none",
          scrollTrigger: { trigger: sectionEl, start: "top 80%", end: "top 30%", scrub: 0.5, invalidateOnRefresh: true },
        });
        gsap.to(glow, { opacity: 0.3, ease: "none",
          scrollTrigger: { trigger: sectionEl, start: "bottom 40%", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden">
      <div data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

      <div ref={(el) => { if (el) glowRefs.current[0] = el; }} className="absolute top-1/3 left-[10%] w-[400px] h-[400px] rounded-full bg-[#F7931A]/[0.03] blur-[100px] pointer-events-none" style={{ animation: "ambientPulse1 8s ease-in-out infinite", willChange: "opacity, transform" }} />
      <div ref={(el) => { if (el) glowRefs.current[1] = el; }} className="absolute top-1/2 right-[10%] w-[350px] h-[350px] rounded-full bg-[#627EEA]/[0.03] blur-[100px] pointer-events-none" style={{ animation: "ambientPulse2 10s ease-in-out infinite", willChange: "opacity, transform" }} />
      <div ref={(el) => { if (el) glowRefs.current[2] = el; }} className="absolute bottom-[20%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#26A17B]/[0.03] blur-[80px] pointer-events-none" style={{ animation: "ambientPulse3 12s ease-in-out infinite", willChange: "opacity, transform" }} />

      <div ref={bloomRef} className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(108,99,255,0.04) 0%, rgba(88,70,200,0.02) 40%, transparent 65%)", animation: "bloomDrift 15s ease-in-out infinite", willChange: "transform" }} />
      <div ref={warmBloomRef} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(247,147,26,0.025) 0%, rgba(199,166,40,0.015) 35%, transparent 60%)", animation: "warmDrift 12s ease-in-out infinite", willChange: "transform" }} />

      <div ref={dustRef} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ willChange: "transform" }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} data-particle className="absolute rounded-full"
            style={{
              width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
              background: i % 4 === 0 ? "rgba(108,99,255,0.3)" : i % 4 === 1 ? "rgba(255,255,255,0.15)" : "rgba(247,147,26,0.2)",
              left: `${5 + (i * 17) % 90}%`, top: `${10 + (i * 23) % 80}%`,
              animation: `particleFloat${i % 3} ${8 + (i % 5) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
              willChange: "transform, opacity",
            }} />
        ))}
      </div>

      <div className="absolute top-0 left-[5%] w-[400px] h-[100%] pointer-events-none"
        style={{ background: "linear-gradient(170deg, rgba(108,99,255,0.02) 0%, transparent 40%)", transform: "skewX(-8deg)" }} />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headingChoreographyRef} className="text-center mb-3 sm:mb-5 lg:mb-6">
          <p data-eyebrow className="text-xs uppercase tracking-[0.2em] text-amber-400/80 font-medium mb-2" style={{ willChange: "transform, opacity" }}>
            Crypto Payment Cards
          </p>
          <h2 data-heading className="text-2xl sm:text-3xl lg:text-4xl font-bold max-w-2xl mx-auto" style={{ willChange: "clip-path" }}>
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Pre-loaded cryptocurrency gift cards
            </span>
          </h2>
          <p data-subtitle className="mt-2 text-sm sm:text-base text-white/40 max-w-xl mx-auto leading-relaxed" style={{ willChange: "transform, opacity" }}>
            Come with complimentary wallet for instant redemption, remittance and exchange services.
          </p>
        </div>

        <AnimatedCarousel />
      </div>

      <style jsx global>{`
        @keyframes ambientPulse1 { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        @keyframes ambientPulse2 { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
        @keyframes ambientPulse3 { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.4; } }
        @keyframes bloomDrift {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.08); opacity: 0.7; }
        }
        @keyframes warmDrift {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(-10px); opacity: 0.7; }
        }
        @keyframes particleFloat0 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { opacity: 0.8; }
          50% { transform: translateY(-20px) translateX(8px); opacity: 0.3; }
          75% { opacity: 0.7; }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          33% { transform: translateY(-15px) translateX(-6px); opacity: 0.7; }
          66% { transform: translateY(-8px) translateX(10px); opacity: 0.2; }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
          40% { transform: translateY(-25px) translateX(4px); opacity: 0.2; }
          70% { transform: translateY(-12px) translateX(-8px); opacity: 0.6; }
        }
        @keyframes pinSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgb(7,8,15))" }} />
    </section>
  );
}
