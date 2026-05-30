"use client";

import { useState, useRef, useEffect } from "react";
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

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const inputBase =
  "w-full bg-[#1a1a1a] border border-white/[0.12] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#20aab6] focus:shadow-[0_0_0_3px_rgba(32,170,182,0.12)]";
const inputError = "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]";
const labelCls = "block text-[13px] font-medium text-white/60 mb-1.5";

const countryCodes = [
  { code: "+1-868", label: "TT +1-868" },
  { code: "+1-876", label: "JM +1-876" },
  { code: "+1-242", label: "BS +1-242" },
  { code: "+1", label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
];

const countries = ["Trinidad & Tobago", "Jamaica", "Bahamas", "Other"];

function getPasswordStrength(pw: string) {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
  if (score <= 3) return { label: "Fair", color: "bg-amber-500", width: "55%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

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
  const [selected, setSelected] = useState<"individual" | "business" | null>(null);
  const [step, setStep] = useState(0); // 0 = selector, 1-4 = form steps
  const [dir, setDir] = useState(1);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Get Started | PSI"; }, []);

  // Form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", countryCode: "+1-868", country: "Trinidad & Tobago",
    password: "", confirmPassword: "",
    agreeTerms: false, confirmAge: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: Record<string, string> = {};
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.agreeTerms) e.agreeTerms = "You must agree to the Terms";
    if (!form.confirmAge) e.confirmAge = "You must confirm your age";
    setErrors(e);
    if (Object.keys(e).length === 0) {
      alert("Account creation submitted! (placeholder)");
    }
  };

  const strength = getPasswordStrength(form.password);

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
      {step === 0 && (
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
                    className={`relative rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center cursor-pointer transition-all duration-300 outline-none ${isSel ? "" : selected ? "opacity-50" : "hover:opacity-80"}`}
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
                onClick={() => { if (selected) { go(1); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100); } }}
                className={`relative overflow-hidden px-8 py-3.5 rounded-full text-[15px] font-semibold flex items-center gap-2 group mx-auto transition-all duration-500 ${selected ? "text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25),0_0_60px_rgba(32,170,182,0.1)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35),0_0_80px_rgba(32,170,182,0.15)] cursor-pointer" : "text-white/25 bg-white/[0.04] border border-white/[0.06] cursor-not-allowed"}`}
              >
                {selected && (<><span className="absolute inset-0 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]" /><span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" /></>)}
                <span className="relative flex items-center gap-2">Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </motion.button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Supported Assets — shown before form */}
      {step === 0 && (
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
      )}

      {/* Trust signals bar — shown after account type selection */}
      {step > 0 && (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-[#0d0d0d] py-6 border-b border-white/[0.04] mt-[4.5rem]"
      >
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-0 md:divide-x md:divide-white/[0.06]">
              {[
                {
                  icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
                  label: "Bank-grade Security",
                  sub: "AES-256 & TLS 1.3 encrypted",
                },
                {
                  icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                  label: "Same-day Verification",
                  sub: "Most KYC approvals within 24hrs",
                },
                {
                  icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.418" /></svg>,
                  label: "4 Jurisdictions",
                  sub: "T&T, Jamaica, Bahamas & Intl",
                },
                {
                  icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
                  label: "Your Data is Safe",
                  sub: "We never sell or share your info",
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center px-4">
                  <div className="text-[#20aab6] mb-2">{item.icon}</div>
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Multi-step form */}
      {step > 0 && (
        <section ref={formRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(32,170,182,0.06) 0%, transparent 70%)", top: "20%", left: "50%", transform: "translateX(-50%)", animation: "ambientPulse1 8s ease-in-out infinite" }} />
          </div>

          <div className="relative z-10 w-full max-w-lg mx-auto px-6">
            {/* Progress bar */}
            <div className="flex items-center justify-center gap-0 mb-10">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${s < step ? "bg-[#20aab6] text-white" : s === step ? "bg-[#20aab6]/15 text-[#20aab6] border-2 border-[#20aab6]" : "bg-white/[0.06] text-white/25 border border-white/[0.08]"}`}>
                    {s < step ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : s}
                  </div>
                  {s < 4 && <div className={`w-12 sm:w-16 h-[2px] mx-1 transition-colors duration-300 ${s < step ? "bg-[#20aab6]" : "bg-white/[0.08]"}`} />}
                </div>
              ))}
            </div>

            {/* Step labels */}
            <div className="flex justify-between px-1 mb-8">
              <span className={`text-[10px] ${step >= 1 ? "text-white/50" : "text-white/20"}`}>Personal</span>
              <span className={`text-[10px] ${step >= 2 ? "text-white/50" : "text-white/20"}`}>Security</span>
              <span className={`text-[10px] ${step >= 3 ? "text-white/50" : "text-white/20"}`}>Verify</span>
              <span className={`text-[10px] ${step >= 4 ? "text-white/50" : "text-white/20"}`}>Submit</span>
            </div>

            {/* Animated step content */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeInOut" }}>

                  {/* STEP 1 */}
                  {step === 1 && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Personal Details</h2>
                      <p className="text-sm text-white/30 mb-6">Tell us a bit about yourself.</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelCls}>First Name</label>
                          <input className={`${inputBase} ${errors.firstName ? inputError : ""}`} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="John" />
                          {errors.firstName && <p className="text-[11px] text-red-400 mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                          <label className={labelCls}>Last Name</label>
                          <input className={`${inputBase} ${errors.lastName ? inputError : ""}`} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Doe" />
                          {errors.lastName && <p className="text-[11px] text-red-400 mt-1">{errors.lastName}</p>}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className={labelCls}>Email Address</label>
                        <input type="email" className={`${inputBase} ${errors.email ? inputError : ""}`} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
                        {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
                      </div>
                      <div className="mb-4">
                        <label className={labelCls}>Phone Number</label>
                        <div className="flex gap-2">
                          <select className={`${inputBase} w-[130px] shrink-0`} value={form.countryCode} onChange={(e) => set("countryCode", e.target.value)}>
                            {countryCodes.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                          </select>
                          <input type="tel" className={`${inputBase} flex-1 ${errors.phone ? inputError : ""}`} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="123-4567" />
                        </div>
                        {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
                      </div>
                      <div className="mb-6">
                        <label className={labelCls}>Country</label>
                        <select className={inputBase} value={form.country} onChange={(e) => set("country", e.target.value)}>
                          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { if (validate1()) go(2); }}
                          className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#20aab6] shadow-[0_0_15px_rgba(32,170,182,0.2)] hover:shadow-[0_0_25px_rgba(32,170,182,0.3)] transition-shadow flex items-center gap-2"
                        >
                          Next <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Account Security</h2>
                      <p className="text-sm text-white/30 mb-6">Create a strong password for your account.</p>
                      <div className="mb-4">
                        <label className={labelCls}>Password</label>
                        <div className="relative">
                          <input type={showPw ? "text" : "password"} className={`${inputBase} pr-12 ${errors.password ? inputError : ""}`} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimum 8 characters" />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">{showPw ? "Hide" : "Show"}</button>
                        </div>
                        {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
                        {/* Strength bar */}
                        {form.password && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                            </div>
                            <p className="text-[11px] text-white/30 mt-1">{strength.label}</p>
                          </div>
                        )}
                      </div>
                      <div className="mb-6">
                        <label className={labelCls}>Confirm Password</label>
                        <input type={showPw ? "text" : "password"} className={`${inputBase} ${errors.confirmPassword ? inputError : ""}`} value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter your password" />
                        {errors.confirmPassword && <p className="text-[11px] text-red-400 mt-1">{errors.confirmPassword}</p>}
                      </div>
                      <div className="flex justify-between">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go(1)}
                          className="px-5 py-2.5 rounded-full text-[14px] font-medium text-white/40 hover:text-white/60 bg-white/[0.04] border border-white/[0.08] transition-all flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg> Back
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { if (validate2()) go(3); }}
                          className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#20aab6] shadow-[0_0_15px_rgba(32,170,182,0.2)] hover:shadow-[0_0_25px_rgba(32,170,182,0.3)] transition-shadow flex items-center gap-2"
                        >
                          Next <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Identity Verification</h2>
                      <p className="text-sm text-white/30 mb-6">We&apos;ll need to verify your identity</p>
                      <div className="space-y-4 mb-6">
                        {[
                          "A valid government-issued ID (passport or national ID)",
                          "Proof of address (utility bill or bank statement, less than 3 months old)",
                          "A selfie for liveness check",
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#20aab6]/15 flex items-center justify-center shrink-0 mt-0.5">
                              <svg className="w-3.5 h-3.5 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[13px] text-[#20aab6]/60 mb-6 italic">Most verifications are approved the same business day.</p>
                      <div className="flex justify-between">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go(2)}
                          className="px-5 py-2.5 rounded-full text-[14px] font-medium text-white/40 hover:text-white/60 bg-white/[0.04] border border-white/[0.08] transition-all flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg> Back
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go(4)}
                          className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#20aab6] shadow-[0_0_15px_rgba(32,170,182,0.2)] hover:shadow-[0_0_25px_rgba(32,170,182,0.3)] transition-shadow flex items-center gap-2"
                        >
                          I&apos;m Ready <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 4 && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Review & Submit</h2>
                      <p className="text-sm text-white/30 mb-6">Please confirm your details before creating your account.</p>
                      {/* Summary card */}
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 mb-6 space-y-3">
                        {[
                          { label: "Name", value: `${form.firstName} ${form.lastName}` },
                          { label: "Email", value: form.email },
                          { label: "Country", value: form.country },
                          { label: "Account Type", value: selected === "individual" ? "Individual" : "Business" },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between items-center">
                            <span className="text-[13px] text-white/30">{row.label}</span>
                            <span className="text-[13px] text-white/70 font-medium">{row.value || "—"}</span>
                          </div>
                        ))}
                      </div>
                      {/* Checkboxes */}
                      <div className="space-y-3 mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={form.agreeTerms} onChange={(e) => set("agreeTerms", e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.06] accent-[#20aab6]"
                          />
                          <span className="text-[13px] text-white/50 leading-relaxed">
                            I agree to PSI&apos;s <a href="/legal" className="text-[#20aab6] hover:underline">Terms of Service</a> and <a href="/legal" className="text-[#20aab6] hover:underline">Privacy Policy</a>
                          </span>
                        </label>
                        {errors.agreeTerms && <p className="text-[11px] text-red-400 ml-7">{errors.agreeTerms}</p>}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={form.confirmAge} onChange={(e) => set("confirmAge", e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.06] accent-[#20aab6]"
                          />
                          <span className="text-[13px] text-white/50 leading-relaxed">I confirm I am 18 years or older</span>
                        </label>
                        {errors.confirmAge && <p className="text-[11px] text-red-400 ml-7">{errors.confirmAge}</p>}
                      </div>
                      <div className="flex justify-between">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go(3)}
                          className="px-5 py-2.5 rounded-full text-[14px] font-medium text-white/40 hover:text-white/60 bg-white/[0.04] border border-white/[0.08] transition-all flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg> Back
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                          className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#20aab6] shadow-[0_0_15px_rgba(32,170,182,0.2)] hover:shadow-[0_0_25px_rgba(32,170,182,0.3)] transition-shadow flex items-center gap-2"
                        >
                          Create My Account <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </motion.button>
                      </div>
                      <p className="text-center text-[13px] text-white/25 mt-6">
                        Already have an account? <a href="#" className="text-[#20aab6] hover:underline">Sign in</a>
                      </p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

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
