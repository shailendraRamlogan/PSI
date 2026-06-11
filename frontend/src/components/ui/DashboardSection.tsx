"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── Balance types ─── */
type CurrencyKey = "BSD" | "USD" | "USDT";

interface BalanceState {
  BSD: number;
  USD: number;
  USDT: number;
}

const CURRENCY_CONFIG: Record<CurrencyKey, {
  label: string;
  symbol: string;
  gradient: string;
  iconBg: string;
  iconPath: string;
  growth: string;
}> = {
  BSD:  { label: "Local Fiat (BSD)", symbol: "$", gradient: "bg-[#20aab6]/10", iconBg: "bg-blue-500", iconPath: "M2 21h20M2 21V8l7-5 5 5 8-4v17", growth: "+12.5%" },
  USD:  { label: "US Dollar (USD)", symbol: "$", gradient: "bg-[#20aab6]/10", iconBg: "bg-teal-500", iconPath: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", growth: "+8.2%" },
  USDT: { label: "Tether (USDT)", symbol: "₮", gradient: "bg-[#20aab6]/10", iconBg: "bg-emerald-500", iconPath: "m23 6-9.5 9.5-5-5L1 18", growth: "+3.1%" },
};

const CURRENCY_KEYS: CurrencyKey[] = ["BSD", "USD", "USDT"];

/* ─── Live Transaction Feed types ─── */
interface LiveTransaction {
  id: number;
  type: string;
  ref: string;
  amount: string;
  status: "pending" | "completed";
  exiting?: boolean;
  entering?: boolean;
}

interface TransactionTemplate {
  type: string;
  amount: string;
  balanceUpdates: { currency: CurrencyKey; delta: number }[];
}

const TRANSACTION_POOL: TransactionTemplate[] = [
  { type: "USDT Deposit", amount: "+₮250", balanceUpdates: [{ currency: "USDT", delta: 250 }] },
  { type: "USD Wire Received", amount: "+$840", balanceUpdates: [{ currency: "USD", delta: 840 }] },
  { type: "BSD Local Transfer", amount: "+B$320", balanceUpdates: [{ currency: "BSD", delta: 320 }] },
  { type: "USDT→USD Conversion", amount: "-₮500 / +$498", balanceUpdates: [{ currency: "USDT", delta: -500 }, { currency: "USD", delta: 498 }] },
  { type: "Institutional Transfer", amount: "+$4,820", balanceUpdates: [{ currency: "USD", delta: 4820 }] },
  { type: "Card Withdrawal", amount: "-B$120", balanceUpdates: [{ currency: "BSD", delta: -120 }] },
];

let txCounter = 5; // starts after the static TXN-004

function formatValue(symbol: string, value: number): string {
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── Balance Card with animated counter ─── */
function BalanceCard({
  currency,
  value,
  pulseColor,
}: {
  currency: CurrencyKey;
  value: number;
  pulseColor: string | null;
}) {
  const config = CURRENCY_CONFIG[currency];
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef<number>(0);
  const prevTargetRef = useRef(value);

  // Animated counter on value change
  useEffect(() => {
    if (prevTargetRef.current === value) return;

    const startValue = prevTargetRef.current;
    const endValue = value;
    const duration = 800;
    const startTime = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(startValue + (endValue - startValue) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    prevTargetRef.current = value;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <div
      className={`rounded-xl ${config.gradient} border border-white/[0.04] p-3 sm:p-4 transition-shadow duration-600 relative`}
      style={{
        boxShadow: pulseColor
          ? `0 0 12px ${pulseColor}`
          : "none",
        transition: "box-shadow 600ms ease-out",
      }}
    >
      {/* Icon badge top-left */}
      <div className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-lg ${config.iconBg} flex items-center justify-center`}>
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={config.iconPath} />
        </svg>
      </div>
      {/* Growth badge top-right */}
      <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold">
        {config.growth}
      </div>
      <div className="mt-7 mb-1">
        <span className="text-[10px] sm:text-xs text-white/40 font-medium">
          {config.label}
        </span>
      </div>
      <p className="text-sm sm:text-base font-bold text-white mt-0.5">
        {formatValue(config.symbol, displayValue)}
      </p>
    </div>
  );
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  const mockupRef = useRef<HTMLDivElement>(null);

  // Mutable balance state
  const [balances, setBalances] = useState<BalanceState>({
    BSD: 12450,
    USD: 9823.45,
    USDT: 15250,
  });

  // Pulse state per currency — holds the glow color or null
  const [pulses, setPulses] = useState<Record<CurrencyKey, string | null>>({
    BSD: null,
    USD: null,
    USDT: null,
  });

  // Total balance animated display
  const [totalDisplay, setTotalDisplay] = useState(balances.BSD + balances.USD + balances.USDT);
  const totalRafRef = useRef<number>(0);
  const totalPrevRef = useRef(balances.BSD + balances.USD + balances.USDT);

  // updateBalance: adds delta to specified currency, triggers animation + pulse
  const updateBalance = useCallback((currency: CurrencyKey, delta: number) => {
    setBalances((prev) => {
      const newVal = prev[currency] + delta;

      // Update total display with animation
      const oldTotal = prev.BSD + prev.USD + prev.USDT;
      const newTotal = newVal + (currency === "BSD" ? 0 : prev.BSD) + (currency === "USD" ? 0 : prev.USD) + (currency === "USDT" ? 0 : prev.USDT);
      const actualNewTotal = prev.BSD + prev.USD + prev.USDT + delta;

      // Animate total
      const startTotal = totalPrevRef.current;
      const endTotal = actualNewTotal;
      const duration = 800;
      const startTime = performance.now();

      if (totalRafRef.current) cancelAnimationFrame(totalRafRef.current);

      const animateTotal = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setTotalDisplay(startTotal + (endTotal - startTotal) * eased);

        if (progress < 1) {
          totalRafRef.current = requestAnimationFrame(animateTotal);
        } else {
          setTotalDisplay(endTotal);
        }
      };
      totalRafRef.current = requestAnimationFrame(animateTotal);
      totalPrevRef.current = actualNewTotal;

      // Pulse the card
      const pulseColor = delta >= 0
        ? "rgba(0,255,136,0.4)"
        : "rgba(255,60,60,0.4)";
      setPulses((p) => ({ ...p, [currency]: pulseColor }));

      // Clear pulse after 600ms
      setTimeout(() => {
        setPulses((p) => ({ ...p, [currency]: null }));
      }, 600);

      return { ...prev, [currency]: newVal };
    });
  }, []);

  // Expose updateBalance on the window for future use
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__psiUpdateBalance = updateBalance;
    }
    return () => {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__psiUpdateBalance;
      }
    };
  }, [updateBalance]);

  // ─── Live Transaction Feed ───
  const INITIAL_TRANSACTIONS: LiveTransaction[] = [
    { id: 1, type: "Local Currency Deposit", ref: "TXN-001", amount: "+B$2,500.00", status: "completed" },
    { id: 2, type: "BSD → USD Conversion", ref: "TXN-002", amount: "-B$1,000.00", status: "completed" },
    { id: 3, type: "USD Credit Received", ref: "TXN-003", amount: "+$985.00", status: "completed" },
    { id: 4, type: "USD → USDT Conversion", ref: "TXN-004", amount: "-$500.00", status: "completed" },
  ];

  const INITIAL_BALANCES: BalanceState = { BSD: 12450, USD: 9823.45, USDT: 15250 };
  const INITIAL_TOTAL = INITIAL_BALANCES.BSD + INITIAL_BALANCES.USD + INITIAL_BALANCES.USDT; // 29773.45

  const [liveTransactions, setLiveTransactions] = useState<LiveTransaction[]>(INITIAL_TRANSACTIONS);
  const feedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isInViewRef = useRef(false);
  const txListRef = useRef<HTMLDivElement>(null);
  const lockedHeightRef = useRef<number | null>(null);
  const ROW_HEIGHT = 48; // fixed px per row
  const isTransitioningRef = useRef(false); // prevents overlap during exit→enter sequence

  // Reduced motion detection
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Reset everything to initial state
  const resetToInitial = useCallback(() => {
    // Clear interval
    if (feedIntervalRef.current !== null) {
      clearInterval(feedIntervalRef.current);
      feedIntervalRef.current = null;
    }
    // Clear all pending timeouts
    pendingTimersRef.current.forEach(clearTimeout);
    pendingTimersRef.current = [];
    isTransitioningRef.current = false;
    lockedHeightRef.current = null;
    // Cancel in-progress counter animations
    if (totalRafRef.current) cancelAnimationFrame(totalRafRef.current);
    // Reset balances
    setBalances(INITIAL_BALANCES);
    totalPrevRef.current = INITIAL_TOTAL;
    setTotalDisplay(INITIAL_TOTAL);
    // Reset pulses
    setPulses({ BSD: null, USD: null, USDT: null });
    // Reset transaction list
    setLiveTransactions(INITIAL_TRANSACTIONS);
    txCounter = 5;
  }, []);

  // Lock list container height on mount
  useEffect(() => {
    if (txListRef.current && lockedHeightRef.current === null) {
      const rect = txListRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        lockedHeightRef.current = rect.height;
        txListRef.current.style.height = `${rect.height}px`;
        txListRef.current.style.overflow = 'hidden';
      }
    }
  }, [liveTransactions]);

  // Start the injection interval — exit-first sequence
  const startFeed = useCallback(() => {
    if (feedIntervalRef.current !== null) {
      clearInterval(feedIntervalRef.current);
    }

    feedIntervalRef.current = setInterval(() => {
      // Skip if previous transition still in progress
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      // Step 1: Mark bottom row as exiting (collapses over 300ms)
      setLiveTransactions((prev) => {
        if (prev.length <= 4) return prev; // don't exit if already at min
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, exiting: true };
        return updated;
      });

      // Step 2: After exit completes (320ms), remove row then inject new one
      const exitTimer = setTimeout(() => {
        // Remove exited row
        setLiveTransactions((prev) => {
          const filtered = prev.filter((tx) => !tx.exiting);

          // Now inject new transaction at top
          const template = TRANSACTION_POOL[Math.floor(Math.random() * TRANSACTION_POOL.length)];
          txCounter++;
          const newTx: LiveTransaction = {
            id: txCounter,
            type: template.type,
            ref: `TXN-${String(txCounter).padStart(3, "0")}`,
            amount: template.amount,
            status: "pending",
            entering: true,
          };

          // Trigger balance updates
          template.balanceUpdates.forEach(({ currency, delta }) => {
            updateBalance(currency, delta);
          });

          // Mark entering as false after animation
          const enterTimer = setTimeout(() => {
            setLiveTransactions((prev2) =>
              prev2.map((tx) => tx.id === newTx.id ? { ...tx, entering: false } : tx)
            );
            isTransitioningRef.current = false;
          }, 420);
          pendingTimersRef.current.push(enterTimer);

          return [newTx, ...filtered];
        });
      }, 320);
      pendingTimersRef.current.push(exitTimer);

      // Mark new tx as completed after 1500ms
      // We need to find the new tx id — use txCounter which was just incremented
      const newId = txCounter;
      const statusTimer = setTimeout(() => {
        setLiveTransactions((prev) =>
          prev.map((tx) => tx.id === newId ? { ...tx, status: "completed" as const } : tx)
        );
      }, 1500);
      pendingTimersRef.current.push(statusTimer);

    }, 3000);
  }, [updateBalance]);

  // IntersectionObserver lifecycle
  useEffect(() => {
    if (!mockupRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (isInViewRef.current) return; // already in view
          isInViewRef.current = true;
          // On re-entry: reset everything first, then start fresh
          resetToInitial();
          // Small delay to let reset settle before starting feed
          const startTimer = setTimeout(() => startFeed(), 500);
          pendingTimersRef.current.push(startTimer);
        } else {
          isInViewRef.current = false;
          // On exit: clear interval and pending timers
          if (feedIntervalRef.current !== null) {
            clearInterval(feedIntervalRef.current);
            feedIntervalRef.current = null;
          }
          pendingTimersRef.current.forEach(clearTimeout);
          pendingTimersRef.current = [];
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(mockupRef.current);
    return () => observer.disconnect();
  }, [resetToInitial, startFeed]);

  useEffect(() => {
    if (!mockupRef.current) return;

    const ctx = gsap.context(() => {
      const frame = mockupRef.current!.querySelector('[data-dashboard-frame]') as HTMLElement;
      if (!frame) return;

      // Scale from 0.9 → 1.0 + rotateX 5deg → 0 + opacity
      gsap.set(frame, { opacity: 0.15, scale: 0.9, rotateX: 5 });
      const frameTl = gsap.timeline({
        scrollTrigger: {
          trigger: mockupRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      });

      frameTl.to(frame, {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        duration: 1.1,
        ease: "power3.out",
        force3D: true,
      });

      // Border glow bloom — intensifies during entry
      const borderGlow = mockupRef.current!.querySelector('[data-border-glow]') as HTMLElement;
      if (borderGlow) {
        gsap.set(borderGlow, { opacity: 0 });
        frameTl.to(borderGlow, {
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
        }, 0.3);
      }

      // Transaction rows stagger in AFTER frame finishes entrance
      const txRows = mockupRef.current!.querySelectorAll('[data-tx-row]');
      if (txRows.length > 0) {
        gsap.set(txRows, { opacity: 0.1, y: 8 });
        frameTl.to(txRows, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          force3D: true,
        }, "-=0.3");
      }
    }, mockupRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mockupRef} className="relative w-full max-w-5xl mx-auto">
      {/* Ambient glow behind dashboard */}
      <div className="absolute -inset-10 bg-[#20aab6]/10 rounded-3xl blur-3xl" />

      {/* Border glow element — blooms during entry */}
      <div data-border-glow className="absolute -inset-1 rounded-2xl pointer-events-none"
        style={{ boxShadow: "0 0 30px rgba(108,99,255,0.08), 0 0 60px rgba(59,130,246,0.04)", willChange: "opacity" }} />

      {/* Cinematic angled frame */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative"
        layout={false}
        style={{
          perspective: "1200px",
        }}
      >
        <div
          data-dashboard-frame
          className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50"
          style={{
            transform: "rotateY(-3deg) rotateX(2deg)",
            transformStyle: "preserve-3d",
            willChange: "transform, opacity",
          }}
        >
          {/* Holographic shimmer overlay */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(32,170,182,0.15) 45%, rgba(32,170,182,0.15) 50%, transparent 55%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 8s ease-in-out infinite",
              }}
            />
          </div>

          {/* Dashboard UI */}
          <div className="bg-[#0a0c18] p-4 sm:p-6">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#20aab6] flex items-center justify-center text-white text-xs font-bold">
                  P
                </div>
                <span className="text-white/80 font-semibold text-sm">
                  PSI Dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-white/40">Live</span>
              </div>
            </div>

            {/* Total Balance header */}
            <div className="mb-4">
              <p className="text-[10px] sm:text-xs text-white/40 font-medium uppercase tracking-wider">Total Balance</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                ${totalDisplay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {CURRENCY_KEYS.map((key) => (
                <BalanceCard
                  key={key}
                  currency={key}
                  value={balances[key]}
                  pulseColor={pulses[key]}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {([
                { label: "Deposit", icon: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3", primary: true },
                { label: "Convert", icon: "m23 6-9.5 9.5-5-5L1 18", primary: false },
                { label: "Send", icon: "M7 7h10M7 17h10M12 7v10M22 7l-5-5M22 7l-5 5M2 17l5 5M2 17l5-5", primary: false },
                { label: "History", icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", primary: false },
              ] as const).map(({ label, icon, primary }) => (
                <button
                  key={label}
                  className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                    primary
                      ? "bg-gradient-accent text-white"
                      : "bg-white/[0.04] text-white/50 hover:text-white/70 border border-white/[0.04]"
                  }`}
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon} />\n                  </svg>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Transactions */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/[0.04]">
                <p className="text-[10px] sm:text-xs text-white/50 font-medium">
                  Recent Transactions
                </p>
              </div>
              <div ref={txListRef}>
              {liveTransactions.map((tx) => {
                const isConversion = /conversion|convert/i.test(tx.type);
                const isPending = tx.status === "pending";
                const isPositive = tx.amount.startsWith("+") && !isConversion;
                const iconBadge = isPending
                  ? { bg: "bg-amber-500", path: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" }
                  : isConversion
                    ? { bg: "bg-blue-500", path: "m23 6-9.5 9.5-5-5L1 18" }
                    : isPositive
                      ? { bg: "bg-emerald-500", path: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" }
                      : { bg: "bg-red-500", path: "M7 7h10M7 17h10M12 7v10M22 7l-5-5M22 7l-5 5M2 17l5 5M2 17l5-5" };

                return (
                <div
                  key={tx.id}
                  data-tx-row
                  className="flex items-center justify-between px-3 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    flexShrink: 0,
                    overflow: "hidden",
                    willChange: "transform, opacity",
                    opacity: tx.exiting && !prefersReducedMotion ? 0 : undefined,
                    transform: tx.entering && !prefersReducedMotion ? `translateY(-${ROW_HEIGHT}px)` : undefined,
                    transition: tx.exiting && !prefersReducedMotion
                      ? "opacity 300ms ease-out, transform 300ms ease-out"
                      : tx.entering && !prefersReducedMotion
                        ? undefined
                        : undefined,
                    animation: tx.entering && !prefersReducedMotion ? "txEnter 400ms ease-out forwards" : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${iconBadge.bg} flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d={iconBadge.path} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-white/70 font-medium">
                        {tx.type}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-white/25">
                        {tx.ref}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[10px] sm:text-xs font-semibold ${
                        tx.amount.startsWith("+")
                          ? "text-emerald-400"
                          : "text-white/50"
                      }`}
                    >
                      {tx.amount}
                    </p>
                    <p
                      className={`text-[9px] sm:text-[10px] ${
                        tx.status === "completed"
                          ? "text-emerald-400/60"
                          : "text-amber-400/60"
                      }`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardSection() {
  const headingChoreographyRef = useHeadingReveal();
  const sectionRef = useRef(null);
  const mockupContainerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const parallaxMult = isMobile ? 0.5 : 1;

    const ctx = gsap.context(() => {
      // Dashboard preview frame parallax at 0.85x (slightly slower)
      if (mockupContainerRef.current) {
        gsap.to(mockupContainerRef.current, {
          y: -25 * parallaxMult,
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

      // Background particles at foreground speed (1.2x)
      if (particlesRef.current) {
        gsap.to(particlesRef.current, {
          y: 30 * parallaxMult,
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

      // Scroll-reactive glow — brightens on entry, dims on exit
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
      {/* Section divider glow */}
      <div ref={dividerRef} data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#20aab6]/30 to-transparent" style={{ willChange: "transform" }} />

      {/* Ambient particles — foreground parallax (1.2x) */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" style={{ willChange: "transform" }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#20aab6]/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading — clip-path choreography */}
        <div
          ref={headingChoreographyRef}
          className="text-center mb-12 sm:mb-16"
        >
          <p
            data-eyebrow
            className="text-xs uppercase tracking-[0.2em] text-[#20aab6] font-medium mb-4"
            style={{ willChange: "transform, opacity" }}
          >
            Your personalized dashboard
          </p>
          <h2
            data-heading
            className="text-2xl sm:text-3xl lg:text-4xl font-bold max-w-2xl mx-auto"
            style={{ willChange: "clip-path" }}
          >
            <span className="text-white">
              Users get access to individualized dashboard tracking real time
              asset balances and transaction history.
            </span>
          </h2>
        </div>

        {/* Dashboard mockup */}
        <div ref={mockupContainerRef} style={{ willChange: "transform" }}>
          <DashboardMockup />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#07080f] to-transparent pointer-events-none" />

      {/* Shimmer keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes txEnter {
          from { transform: translateY(-48px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
