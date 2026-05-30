"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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

export default function IndividualsPage() {
  return (
    <main className="bg-[#07080F] text-white min-h-screen antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(32,170,182,0.08) 0%, transparent 70%)",
              top: "10%",
              left: "10%",
              animation: "ambientPulse1 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(32,170,182,0.06) 0%, transparent 70%)",
              bottom: "10%",
              right: "5%",
              animation: "ambientPulse2 10s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(32,170,182,0.05) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "ambientPulse3 12s ease-in-out infinite",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16">
          {/* Eyebrow badge */}
          <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide uppercase bg-[#20aab6]/10 text-[#20aab6] border border-[#20aab6]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20aab6] animate-pulse" />
              For Individuals
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-[2.5rem] sm:text-[3.5rem] lg:text-[5rem] font-bold leading-[1.15] tracking-tight"
          >
            <span className="text-white">Your money.</span>
            <br />
            <span className="text-white">Your crypto.</span>
            <br />
            <span className="text-[#20aab6]">Your way.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            custom={2}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-6 text-[15px] sm:text-base text-white/40 max-w-[520px] leading-relaxed"
          >
            PSI makes it simple to buy, sell, send, and convert crypto and fiat — from anywhere in the Caribbean and beyond.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/get-started">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-7 py-3 rounded-full text-[14px] font-semibold text-white flex items-center gap-2 group
                  bg-[#20aab6]
                  shadow-[0_0_20px_rgba(32,170,182,0.25),0_0_60px_rgba(32,170,182,0.1)]
                  hover:shadow-[0_0_30px_rgba(32,170,182,0.35),0_0_80px_rgba(32,170,182,0.15)]
                  transition-shadow duration-500"
              >
                <span className="absolute inset-0 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                <span className="relative flex items-center gap-2">
                  Get Started
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-7 py-3 rounded-full text-[14px] font-medium text-white/45 hover:text-white/75
                  bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                Learn More
              </motion.button>
            </a>
          </motion.div>

          {/* Micro-trust line with flag badges */}
          <motion.div
            custom={4}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <span className="text-[13px] text-white/30">Trusted by individuals across 4 jurisdictions</span>
            <div className="flex items-center gap-2">
              {[
                { flagUrl: "https://flagcdn.com/tt.svg", label: "Trinidad & Tobago" },
                { flagUrl: "https://flagcdn.com/jm.svg", label: "Jamaica" },
                { flagUrl: "https://flagcdn.com/bs.svg", label: "Bahamas" },
                { flagUrl: null, label: "International" },
              ].map((j, i) => (
                <motion.span
                  key={j.label}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1117]/80 border border-white/[0.12] text-[12px] text-white/60"
                >
                  <span className="w-5 h-3.5 overflow-hidden rounded-full flex items-center justify-center shrink-0">
                    {j.flagUrl ? (
                      <img
                        src={j.flagUrl}
                        alt={j.label}
                        width={20}
                        height={14}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <svg className="w-4 h-4 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.418" />
                      </svg>
                    )}
                  </span>
                  <span className="sm:hidden">{j.label.split(' ').map((w: string) => w[0]).join('')}</span>
                  <span className="hidden sm:inline">{j.label}</span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Payment Methods Trust Bar */}
      <section className="relative py-12 sm:py-16 bg-[#07080F] border-t border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 mb-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-[13px] text-white/30 font-medium tracking-wide"
          >
            Accepted payment methods &amp; supported assets
          </motion.p>
        </div>

        {/* Scrolling strip */}
        <div
          className="relative overflow-hidden group"
          style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
        >
          <div
            className="flex gap-3 w-max animate-scroll-left group-hover:[animation-play-state:paused]"
          >
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-3">
                {[
                  { ticker: "VISA", name: "Visa", color: "#1A1F71" },
                  { ticker: "MC", name: "Mastercard", color: "#EB001B" },
                  { ticker: "BANK", name: "Bank Transfer", color: "#2563eb" },
                  { ticker: "USDT", name: "Tether", color: "#26A17B" },
                  { ticker: "USDC", name: "USD Coin", color: "#2775CA" },
                  { ticker: "BTC", name: "Bitcoin", color: "#F7931A" },
                  { ticker: "ETH", name: "Ethereum", color: "#627EEA" },
                  { ticker: "TRX", name: "Tron", color: "#FF0013" },
                  { ticker: "TTD", name: "Trinidad Dollar", color: "#20aab6" },
                  { ticker: "JMD", name: "Jamaican Dollar", color: "#009B3A" },
                  { ticker: "BSD", name: "Bahamian Dollar", color: "#00778B" },
                  { ticker: "USD", name: "US Dollar", color: "#3C3B6E" },
                ].map((item, i) => (
                  <div
                    key={`${setIdx}-${i}`}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 shrink-0 cursor-default"
                  >
                    {/* Colored circle with ticker */}
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.ticker.length <= 3 ? item.ticker : item.ticker.slice(0, 2)}
                    </span>
                    <span className="text-[13px] text-white/60 font-medium whitespace-nowrap">{item.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Everything you need, <span className="text-[#20aab6]">in one platform</span>
            </h2>
            <p className="mt-4 text-[15px] text-white/35 max-w-[500px] mx-auto leading-relaxed">
              Buy, sell, send, and convert — all from your phone, all at the best rates.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              {
                tagline: "From fiat to crypto \u2014 in minutes.",
                desc: "Convert your TTD, JMD, BSD or USD into BTC, ETH, USDT, USDC, or TRX instantly — with real-time rates and no hidden fees.",
                cta: "Buy Now",
                image: "https://images.unsplash.com/photo-1640161704729-cbe966a08476?w=800&q=80",
                accent: "#F7931A",
              },
              {
                tagline: "Cash out on your terms \u2014 instantly.",
                desc: "Sell your crypto and receive local fiat directly — choose your preferred currency and get paid without the runaround.",
                cta: "Sell Now",
                image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
                accent: "#2775CA",
              },
              {
                tagline: "Send money across the Caribbean \u2014 instantly.",
                desc: "Transfer fiat or crypto to anyone in Trinidad, Jamaica, the Bahamas or internationally — no branch visits, no delays.",
                cta: "Send Money",
                image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
                accent: "#20aab6",
              },
              {
                tagline: "Swap assets at the best available rate.",
                desc: "Swap between local currencies and digital assets in real time — powered by PSI's live FX engine and Alt5 Sigma rails.",
                cta: "Convert Now",
                image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
                accent: "#627EEA",
              },
            ].map((feature, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={feature.cta}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`flex flex-col ${isEven ? "sm:flex-row" : "sm:flex-row-reverse"} gap-3 items-stretch min-h-[280px] sm:min-h-[220px] sm:max-h-[260px]`}
                >
                  {/* Image */}
                  <div className="w-full sm:w-1/2 shrink-0 group">
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-[#20aab6]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(32,170,182,0.08)] h-full max-h-[160px] sm:max-h-none">
                      <img
                        src={feature.image}
                        alt={feature.tagline}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Dark overlay gradient */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,8,15,0.85) 0%, rgba(7,8,15,0.3) 40%, transparent 70%)" }} />
                      {/* Accent bottom edge */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to right, transparent, ${feature.accent}, transparent)` }} />
                    </div>
                  </div>

                  {/* Text */}
                  <div className={`w-full sm:w-1/2 ${isEven ? "sm:text-left" : "sm:text-right"}`}>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase mb-2"
                      style={{ backgroundColor: `${feature.accent}15`, color: feature.accent, border: `1px solid ${feature.accent}25` }}
                    >
                      {feature.cta === "Buy Now" ? "Buy Crypto" : feature.cta === "Sell Now" ? "Sell Crypto" : feature.cta === "Send Money" ? "Send & Receive" : "Convert & Exchange"}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1.5 max-w-[240px]">
                      {feature.tagline}
                    </h3>
                    <p className="text-xs text-white/40 leading-relaxed mb-3 max-w-[260px]">
                      {feature.desc}
                    </p>
                    <a
                      href="#"
                      className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#20aab6] hover:text-[#20aab6]/80 transition-colors group/cta py-1"
                    >
                      {feature.cta}
                      <svg className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 sm:py-28 bg-[#0a0b14]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Get started in <span className="text-[#20aab6]">3 simple steps</span>
            </h2>
            <p className="mt-4 text-[15px] text-white/35 max-w-[440px] mx-auto leading-relaxed">
              No branch visits. No paperwork. Just a few minutes.
            </p>
          </motion.div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Dashed connector line (desktop only) */}
            <div className="hidden md:block absolute top-[36px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0 border-t-2 border-dashed border-white/[0.08]" />

            {[
              {
                step: 1,
                title: "Create Your Account",
                desc: "Sign up with your email in under 2 minutes. No credit check, no bank appointment required.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                ),
              },
              {
                step: 2,
                title: "Verify Your Identity",
                desc: "Complete our quick KYC process — upload your ID and proof of address. Most verifications are approved same day.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                step: 3,
                title: "Start Transacting",
                desc: "Buy, sell, send or convert crypto and fiat instantly. Your funds, your control.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                {/* Step number badge */}
                <div className="w-12 h-12 rounded-full bg-[#20aab6] flex items-center justify-center text-[16px] font-bold text-white mb-5 shadow-[0_0_20px_rgba(32,170,182,0.25)]">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="text-[#20aab6] mb-4">
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>

                {/* Description */}
                <p className="text-[14px] text-gray-400 leading-relaxed max-w-[280px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 sm:py-28 bg-[#07080F] overflow-hidden">
        {/* Section glow for glass effect */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(32,170,182,0.04) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Trusted by individuals <span className="text-[#20aab6]">across the region</span>
            </h2>
          </motion.div>

          {/* Desktop: 3-up grid. Mobile: scrollable */}
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
            {[
              {
                quote: "I used to spend hours at the bank for international transfers. With PSI I do it from my phone in minutes. The rates are way better too.",
                name: "Kezia M.",
                title: "Freelancer, Trinidad & Tobago",
                photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face",
              },
              {
                quote: "Buying USDT through PSI was the easiest crypto experience I've had. Verified same day, funded within the hour.",
                name: "Andre T.",
                title: "Small Business Owner, Jamaica",
                photo: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=100&h=100&fit=crop&crop=face",
              },
              {
                quote: "Getting paid in USD and converting to BSD used to be a nightmare. PSI made it seamless — I actually understand what I'm paying in fees.",
                name: "Simone R.",
                title: "Remote Worker, Bahamas",
                photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face",
              },
            ].map((t, i) => {
              const initials = t.name.replace(".", "").trim().split(" ").map((n: string) => n[0]).join("");
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="snap-center shrink-0 w-[85%] md:w-auto"
                >
                  <div
                    className="h-full rounded-2xl p-6 sm:p-7 flex flex-col relative overflow-hidden transition-all duration-300 ease-out testimonial-card"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(12px) saturate(150%)",
                      WebkitBackdropFilter: "blur(12px) saturate(150%)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Decorative opening quote mark */}
                    <span className="absolute top-3 right-4 text-[#20aab6] opacity-[0.08] text-[80px] leading-none font-serif pointer-events-none select-none">&ldquo;</span>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mb-4">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className="text-[14px] text-[#20aab6]">&#9733;</span>
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-base sm:text-lg text-white/50 leading-relaxed flex-1 mb-5 italic">
                      {t.quote}
                    </p>

                    {/* Attribution */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05]">
                      {/* Photo avatar with fallback */}
                      <div className="w-14 h-14 rounded-full ring-2 ring-[#20aab6]/60 ring-offset-2 ring-offset-[#07080F] shrink-0 overflow-hidden bg-white/[0.06] flex items-center justify-center shadow-[0_0_12px_rgba(32,170,182,0.15)]">
                        <img
                          src={t.photo}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = "none"; (img.parentElement!.querySelector(".fallback") as HTMLElement)!.style.display = "flex"; }}
                        />
                        <span className="fallback hidden text-[13px] font-bold text-white/50 items-center justify-center">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white/70">{t.name}</p>
                        <p className="text-[11px] text-white/30">{t.title}</p>
                      </div>
                    </div>

                    {/* Subtle label */}
                    <span className="mt-3 self-start text-[9px] italic text-white/15">
                      Featured User
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-2 mt-8 md:hidden">
            {[0,1,2].map((d) => (
              <span key={d} className={`w-2 h-2 rounded-full ${d === 0 ? "bg-[#20aab6]" : "bg-white/15"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Animated gradient bg */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(32,170,182,0.08) 0%, transparent 40%, transparent 60%, rgba(32,170,182,0.05) 100%)",
              animation: "ctaShift 8s ease-in-out infinite alternate",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full -top-1/4 -right-[10%]"
            style={{
              background: "radial-gradient(circle, rgba(32,170,182,0.1) 0%, transparent 70%)",
              animation: "ambientPulse2 10s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full -bottom-[20%] -left-[5%]"
            style={{
              background: "radial-gradient(circle, rgba(32,170,182,0.07) 0%, transparent 70%)",
              animation: "ambientPulse1 12s ease-in-out infinite",
            }}
          />
          <div className="absolute inset-0 border-t border-b border-white/[0.04]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
          >
            Ready to take control of <span className="text-[#20aab6]">your money?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-[15px] text-white/35 max-w-[520px] mx-auto leading-relaxed"
          >
            Join thousands of individuals across the Caribbean using PSI to buy, sell, send and convert — on their terms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Link href="/get-started">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-8 py-3.5 rounded-full text-[15px] font-semibold text-white flex items-center gap-2 group mx-auto
                  bg-[#20aab6]
                  shadow-[0_0_20px_rgba(32,170,182,0.25),0_0_60px_rgba(32,170,182,0.1)]
                  hover:shadow-[0_0_30px_rgba(32,170,182,0.35),0_0_80px_rgba(32,170,182,0.15)]
                  transition-shadow duration-500"
              >
                <span className="absolute inset-0 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                <span className="relative flex items-center gap-2">
                  Create Free Account
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
