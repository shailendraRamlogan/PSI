"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-[14px] font-medium text-white">{question}</span>
        <svg
          className={`w-4 h-4 text-white/30 transition-transform duration-200 shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-[13px] text-white/40 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GetStartedPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"individual" | "business" | null>(null);

  useEffect(() => { document.title = "Get Started | PSI"; }, []);

  const handleContinue = () => {
    if (selected === "individual") router.push("/individuals");
    else if (selected === "business") router.push("/b2b");
  };

  const cardBase: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(12px) saturate(150%)",
    WebkitBackdropFilter: "blur(12px) saturate(150%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  const cardSelected: React.CSSProperties = {
    border: "1px solid rgba(32,170,182,0.5)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(32,170,182,0.15)",
  };

  return (
    <main className="bg-[#07080F] text-white min-h-screen antialiased">
      <Navbar />

      {/* Account Type Selector */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(32,170,182,0.06) 0%, transparent 70%)", top: "20%", left: "50%", transform: "translateX(-50%)", animation: "ambientPulse1 8s ease-in-out infinite" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-24 text-center">
          <motion.h1 custom={0} variants={fadeInUp} initial="hidden" animate="visible" className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight">
            Create your <span className="text-[#20aab6]">PSI account</span>
          </motion.h1>
          <motion.p custom={1} variants={fadeInUp} initial="hidden" animate="visible" className="mt-4 text-[15px] text-white/40 max-w-[400px] mx-auto leading-relaxed">
            Choose how you&apos;ll be using PSI to get started.
          </motion.p>
          <motion.div custom={2} variants={fadeInUp} initial="hidden" animate="visible" className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { key: "individual" as const, title: "I'm an Individual", desc: "Buy, sell, send and convert crypto and fiat for personal use.", icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
              { key: "business" as const, title: "I'm a Business", desc: "Access liquidity rails, ramps, FX, treasury and more for my company.", icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg> },
            ].map((card) => {
              const isSel = selected === card.key;
              return (
                <button key={card.key} onClick={() => setSelected(card.key)}
                  className={`relative rounded-2xl overflow-hidden p-6 sm:p-7 flex flex-col items-center text-center cursor-pointer transition-all duration-300 outline-none ${isSel ? "" : selected ? "opacity-50" : "hover:opacity-80"}`}
                  style={isSel ? { ...cardBase, ...cardSelected } : cardBase}
                >
                  <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl transition-all duration-300 ${isSel ? "bg-[#20aab6]" : "bg-transparent"}`} />
                  <div className={`text-[#20aab6] mb-4 transition-transform duration-300 ${isSel ? "scale-110" : ""}`}>{card.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{card.desc}</p>
                </button>
              );
            })}
          </motion.div>
          <motion.div custom={3} variants={fadeInUp} initial="hidden" animate="visible" className="mt-8">
            <motion.button
              whileHover={selected ? { scale: 1.04, y: -1 } : {}} whileTap={selected ? { scale: 0.97 } : {}}
              disabled={!selected}
              onClick={handleContinue}
              className={`relative overflow-hidden px-8 py-3.5 rounded-full text-[15px] font-semibold flex items-center gap-2 group mx-auto transition-all duration-500 ${selected ? "text-white bg-gradient-accent shadow-[0_0_20px_rgba(32,170,182,0.25),0_0_60px_rgba(32,170,182,0.1)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35),0_0_80px_rgba(32,170,182,0.15)] cursor-pointer" : "text-white/25 bg-white/[0.04] border border-white/[0.06] cursor-not-allowed"}`}
            >
              {selected && (<><span className="absolute inset-0 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]" /><span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" /></>)}
              <span className="relative flex items-center gap-2">Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="relative py-10 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center text-[12px] text-white/25 font-medium tracking-wide mb-6"
          >
            Supported assets &amp; currencies
          </motion.p>

          {/* Crypto row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
            {[
              { ticker: "BTC", name: "Bitcoin", icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
              { ticker: "ETH", name: "Ethereum", icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
              { ticker: "USDT", name: "Tether", icon: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
              { ticker: "USDC", name: "USD Coin", icon: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
              { ticker: "TRX", name: "Tron", icon: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png" },
            ].map((a, i) => (
              <motion.div
                key={a.ticker}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1a1a1a] border border-white/[0.1] hover:border-white/[0.18] transition-colors"
              >
                <img src={a.icon} alt={a.ticker} className="w-5 h-5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-[13px] text-white/70 font-medium">{a.ticker}</span>
                <span className="text-[11px] text-white/30">{a.name}</span>
              </motion.div>
            ))}
          </div>

          {/* Fiat row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              { ticker: "USD", name: "US Dollar", symbol: "$", color: "#3C3B6E" },
              { ticker: "TTD", name: "Trinidad Dollar", symbol: "TT$", color: "#20aab6" },
              { ticker: "JMD", name: "Jamaican Dollar", symbol: "J$", color: "#009B3A" },
              { ticker: "BSD", name: "Bahamian Dollar", symbol: "B$", color: "#00778B" },
            ].map((a, i) => (
              <motion.div
                key={a.ticker}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1a1a1a] border border-white/[0.1] hover:border-white/[0.18] transition-colors"
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ backgroundColor: a.color }}>{a.symbol}</span>
                <span className="text-[13px] text-white/70 font-medium">{a.ticker}</span>
                <span className="text-[11px] text-white/30">{a.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What do I need to sign up?",
                a: "A valid government-issued ID (passport or national ID), proof of address (utility bill or bank statement less than 3 months old), and a selfie for liveness verification.",
              },
              {
                q: "How long does verification take?",
                a: "Most KYC verifications are approved the same business day. In some cases, additional documentation may be required which can take up to 48 hours.",
              },
              {
                q: "Which currencies does PSI support?",
                a: "PSI supports BTC, ETH, USDT, USDC, TRX for crypto, and USD, TTD, JMD, BSD for fiat currencies. More assets are being added regularly.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. PSI uses AES-256 encryption at rest and TLS 1.3 in transit. We never sell or share your personal information with third parties.",
              },
              {
                q: "Can I use PSI for my business?",
                a: "Yes! PSI offers business accounts with access to liquidity rails, FX, treasury management, and more. Select \"I'm a Business\" during signup.",
              },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
