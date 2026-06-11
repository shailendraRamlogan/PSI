"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const trustBadges = [
  { label: "Stripe", symbol: "S" },
  { label: "Alt5 Sigma", symbol: "A5" },
  { label: "USDT", symbol: "₮" },
  { label: "USDC", symbol: "◎" },
  { label: "BTC", symbol: "₿" },
  { label: "ETH", symbol: "Ξ" },
  { label: "TRX", symbol: "T" },
];

function CountUp({ target, suffix = "", duration = 1.5 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const stats = [
  {
    value: 4,
    suffix: "",
    label: "Jurisdictions",
    sub: "T&T, Jamaica, Bahamas, International",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    value: 5,
    suffix: "",
    label: "Supported Currencies",
    sub: "USD, TTD, JMD, BSD, USDT",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: 170,
    suffix: "+",
    label: "Payment Methods",
    sub: "Cards, bank transfers, crypto rails",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    value: 5,
    suffix: "",
    label: "Crypto Assets",
    sub: "BTC, ETH, USDT, USDC, TRX",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    value: 0,
    suffix: "",
    label: "Bank-grade Security",
    sub: "SOC 2, AML, KYB",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export default function B2BPage() {
  return (
    <main className="min-h-screen bg-[#07080F] text-white">
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
              top: "30%",
              right: "5%",
              animation: "ambientPulse2 10s ease-in-out infinite",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16">
          <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible" className="mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide uppercase bg-[#20aab6]/10 text-[#20aab6] border border-[#20aab6]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20aab6] animate-pulse" />
              For Business
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] font-bold leading-[1.15] tracking-tight"
          >
            <span className="text-white">Liquidity infrastructure</span>
            <br />
            <span className="text-white">for </span>
            <span className="text-[#20aab6]">Caribbean &amp; global business.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-5 text-[15px] sm:text-base text-white/40 max-w-[520px] leading-relaxed"
          >
            PSI connects businesses to fiat and stablecoin rails across Trinidad &amp; Tobago, Jamaica, Bahamas, and international markets — with institutional-grade on-ramp and off-ramp infrastructure.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/signup?type=business">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-7 py-3 rounded-full text-[14px] font-semibold text-white flex items-center gap-2 group
                  bg-gradient-accent
                  shadow-[0_0_20px_rgba(32,170,182,0.25),0_0_60px_rgba(32,170,182,0.1)]
                  hover:shadow-[0_0_30px_rgba(32,170,182,0.35),0_0_80px_rgba(32,170,182,0.15)]
                  transition-shadow duration-500"
              >
                <span className="absolute inset-0 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                <span className="relative flex items-center gap-2">
                  Register
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </Link>
            <Link href="mailto:sales@psi.ourea.tech">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-7 py-3 rounded-full text-[14px] font-medium text-white/45 hover:text-white/75
                  bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                Talk to Sales
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-4 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl bg-[#0d1117]/90 backdrop-blur-md border border-white/[0.08] p-6 md:p-8 overflow-hidden"
          >
            {/* Subtle radial glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(32,170,182,0.06) 0%, transparent 70%)" }} />

            <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-0">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className={`flex flex-col items-center justify-center text-center md:px-5 py-4 ${i > 0 ? "md:border-l md:border-[#20aab6]/20" : "md:pl-0"} p-4 rounded-xl md:rounded-none bg-white/[0.02] md:bg-transparent`}
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {stat.label === "Bank-grade Security" ? (
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 text-[#20aab6]" style={{ filter: "drop-shadow(0 0 8px rgba(32,170,182,0.35))" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ) : (
                      <CountUp target={stat.value} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-[12px] md:text-sm font-medium text-gray-400 mt-1">{stat.label}</div>
                  <div className="text-[10px] md:text-[11px] text-white/25 mt-0.5 leading-relaxed">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide uppercase bg-[#20aab6]/10 text-[#20aab6] border border-[#20aab6]/20 mb-5">
              Core Services
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Everything your business needs to <span className="text-[#20aab6]">move money</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              title: "On-Ramp / Off-Ramp",
              image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
              tagline: "Convert fiat to crypto and back — instantly.",
              desc: "PSI enables businesses to move between local fiat (TTD, JMD, BSD) and digital assets (USDT, USDC, BTC, ETH, TRX) with real-time settlement powered by Alt5 Sigma rails.",
              cta: "Explore Ramps",
              href: "#ramps",
            },
            {
              title: "FX & Remittance",
              image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&q=80",
              tagline: "Send money across borders without the friction.",
              desc: "Multi-currency remittance supporting USD, GBP, EUR, CNY, TTD, JMD, BSD — with live FX rates and per-jurisdiction compliance built in.",
              cta: "Explore Remittance",
              href: "#remittance",
            },
            {
              title: "Treasury & Yield",
              image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80",
              tagline: "Put your idle capital to work.",
              desc: "Deposit into configurable investment products with defined APY, lock-up terms, and quarterly dividends — managed through PSI's treasury engine.",
              cta: "Explore Treasury",
              href: "#treasury",
            },
            {
              title: "Gift Card Marketplace",
              image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
              tagline: "Issue and redeem branded value cards.",
              desc: "Offer crypto-branded gift cards in TTD and USD denominations, redeemable directly to business wallet balances.",
              cta: "Explore Gift Cards",
              href: "#gift-cards",
            },
          ].map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group rounded-2xl bg-[#161616] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
            >
              <div className={`flex flex-col md:flex-row items-stretch h-full ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                {/* Service image */}
                <div className="w-full md:w-5/12 min-h-[200px] md:min-h-0 relative overflow-hidden group/img">
                  <img
                    src={svc.image}
                    alt={svc.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />
                  {/* Dark overlay gradient */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
                  {/* Side overlay for desktop */}
                  <div className="hidden md:block absolute inset-0" style={{ background: "linear-gradient(to right, transparent 50%, rgba(22,22,22,0.8) 100%)" }} />
                  {/* Hover teal glow */}
                  <div className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500" style={{ boxShadow: "inset 0 0 30px rgba(32,170,182,0.15)" }} />
                </div>

                {/* Text */}
                <div className="w-full md:w-7/12 p-5 sm:p-6 flex flex-col justify-center">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">{svc.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-[#20aab6] font-medium mb-1.5">{svc.tagline}</p>
                  <p className="text-[12px] sm:text-[13px] text-white/40 leading-relaxed mb-3">{svc.desc}</p>
                  <a
                    href={svc.href}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#20aab6] hover:text-[#20aab6]/80 transition-colors group/cta"
                  >
                    {svc.cta}
                    <svg className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      {/* Who PSI Serves */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Built for the businesses <span className="text-[#20aab6]">moving money</span> across borders
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Import & Export Companies",
                desc: "Convert and settle cross-border payments in local or digital currency without the FX markup.",
                image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=600&q=80",
              },
              {
                title: "Finance & Fintech Firms",
                desc: "Integrate PSI's liquidity rails into your own product via API.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
              },
              {
                title: "Real Estate & Construction",
                desc: "Move large capital across jurisdictions with audit-grade transaction records.",
                image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
              },
              {
                title: "E-commerce & Retail",
                desc: "Accept crypto at checkout and settle in fiat — no volatility risk.",
                image: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=600&q=80",
              },
              {
                title: "Gaming & Casino Operations",
                desc: "High-volume payout infrastructure with stablecoin and fiat settlement.",
                image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&q=80",
              },
              {
                title: "Supply Chain & Manufacturing",
                desc: "Manage multi-currency supplier payments from a single treasury dashboard.",
                image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className="group relative rounded-xl overflow-hidden border border-white hover:border-white transition-all duration-300 min-h-[200px]"
                style={{
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Dark overlay */}
                <div className="absolute inset-0 transition-all duration-300 group-hover:from-black/85 group-hover:via-black/65 group-hover:to-black/45" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.55) 100%)", borderRadius: "inherit" }} />
                {/* Hover teal bottom glow */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(to top, rgba(32,170,182,0.1), transparent)" }} />

                {/* Content */}
                <div className="relative z-10 p-6 flex flex-col justify-end h-full min-h-[200px]">
                  <h3 className="text-lg font-bold text-white mb-1.5">{card.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance & Trust */}
      <section className="relative py-20 sm:py-28 bg-[#0a0b14]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Built for <span className="text-[#20aab6]">regulated markets</span>
            </h2>
            <p className="mt-4 text-[15px] text-white/35 max-w-[580px] mx-auto leading-relaxed">
              PSI operates with full KYB, AML, and compliance infrastructure across Caribbean and international jurisdictions — so your business doesn't have to build it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "KYB/KYC Built In",
                desc: "Automated business and identity verification via our 4-step onboarding wizard, Sumsub-ready.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                ),
                watermark: (
                  <svg className="w-[120px] h-[120px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: "AML Monitoring",
                desc: "Per-transaction anti-money laundering screening with jurisdiction-specific limits for TT, JM, BS, and International.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                watermark: (
                  <svg className="w-[120px] h-[120px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                title: "Audit-Grade Security",
                desc: "TLS 1.3, AES-256 encryption at rest, immutable audit logs, PCI DSS via Stripe, and role-based access control.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                watermark: (
                  <svg className="w-[120px] h-[120px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 compliance-card"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#20aab6] z-10" />

                {/* Background watermark */}
                <div className="absolute bottom-2 right-2 text-[#20aab6] opacity-[0.04] pointer-events-none">
                  {card.watermark}
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 sm:p-7">
                  <div className="w-10 h-10 rounded-lg bg-[#20aab6]/10 border border-[#20aab6]/15 flex items-center justify-center text-[#20aab6] mb-4 group-hover:bg-[#20aab6]/15 transition-colors">
                    {card.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Jurisdiction Coverage */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { flagUrl: "https://flagcdn.com/tt.svg", label: "Trinidad & Tobago" },
              { flagUrl: "https://flagcdn.com/jm.svg", label: "Jamaica" },
              { flagUrl: "https://flagcdn.com/bs.svg", label: "Bahamas" },
              { flagUrl: null, label: "International" },
            ].map((j, i) => (
              <motion.span
                key={j.label}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0d1117]/80 border border-white/[0.12] text-[13px] text-white/70 hover:text-white/90 hover:border-white/[0.18] transition-all duration-300"
              >
                <span className="w-6 h-4 overflow-hidden rounded-full flex items-center justify-center shrink-0">
                  {j.flagUrl ? (
                    <img
                      src={j.flagUrl}
                      alt={j.label}
                      width={24}
                      height={16}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-4 h-4 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.732-3.558" />
                    </svg>
                  )}
                </span>
                {j.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 sm:py-28 bg-[#0a0b14] overflow-hidden">
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
              Trusted by businesses <span className="text-[#20aab6]">across the region</span>
            </h2>
          </motion.div>

          {/* Desktop: 3-up grid. Mobile: scrollable */}
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
            {[
              {
                quote: "PSI cut our cross-border settlement time from 3 days to under 4 hours. The on-ramp to USDT has completely changed how we pay our international suppliers.",
                name: "Marcus Chen",
                title: "CFO",
                company: "Caribbean Trade Logistics Ltd.",
                photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
              },
              {
                quote: "Onboarding was seamless — we were verified and processing payments within 48 hours. The FX rates are significantly better than what our bank was offering for JMD conversions.",
                name: "Andrea Williams",
                title: "Head of Treasury",
                company: "Island Financial Group",
                photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
              },
              {
                quote: "We handle high-volume gaming payouts across multiple jurisdictions. PSI\'s stablecoin settlement gives us speed and compliance we couldn\'t get anywhere else in the region.",
                name: "David Rahming",
                title: "Director of Operations",
                company: "Nassau Gaming Ventures",
                photo: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop&crop=face",
              },
            ].map((t, i) => {
              const initials = t.name.split(" ").map((n: string) => n[0]).join("");
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
                    <div className="w-14 h-14 rounded-full ring-2 ring-[#20aab6]/60 ring-offset-2 ring-offset-[#0a0b14] shrink-0 overflow-hidden bg-white/[0.06] flex items-center justify-center shadow-[0_0_12px_rgba(32,170,182,0.15)]">
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
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/[0.04] border border-white/[0.08] text-white/35">{t.company}</span>
                    </div>
                  </div>

                  {/* Subtle label */}
                  <span className="mt-3 self-start text-[9px] italic text-white/15">
                    Featured Partner
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
            Ready to move money at <span className="text-[#20aab6]">internet speed?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-[15px] text-white/35 max-w-[520px] mx-auto leading-relaxed"
          >
            Join businesses across the Caribbean and beyond using PSI to manage fiat, crypto, and stablecoin flows from one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/signup?type=business">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-8 py-3.5 rounded-full text-[14px] font-semibold text-white flex items-center gap-2 group
                  bg-gradient-accent
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
            <Link href="mailto:sales@psi.ourea.tech">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden px-8 py-3.5 rounded-full text-[14px] font-medium text-white/45 hover:text-white/75
                  bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                Contact Sales
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="relative border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <motion.p
            custom={4}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-[11px] uppercase tracking-[0.15em] text-white/20 text-center mb-6"
          >
            Payment Rails & Infrastructure
          </motion.p>

          <motion.div
            custom={5}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap"
          >
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-[#20aab6]/20 hover:bg-white/[0.04] transition-all duration-300 group cursor-default"
              >
                <span className="text-lg font-bold text-[#20aab6]/60 group-hover:text-[#20aab6]/90 transition-colors">
                  {badge.symbol}
                </span>
                <span className="text-[12px] font-medium text-white/30 group-hover:text-white/50 transition-colors">
                  {badge.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
