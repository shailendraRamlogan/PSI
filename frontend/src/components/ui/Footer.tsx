"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const footerLinks = {
  Products: [
    { label: "B2B Payments", href: "/b2b" },
    { label: "Visa Rail Card", href: "#visa" },
    { label: "Gift Cards", href: "#gift-cards" },
    { label: "Tokenization", href: "#tokenization" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "AML Policy", href: "/legal/aml" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "Risk Disclosure", href: "/legal/risk" },
  ],
};

const socialLinks = [
  {
    label: "Twitter / X",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Discord",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaGlowRef = useRef<HTMLDivElement>(null);
  const topBorderGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const ctx = gsap.context(() => {
      // Content fades up gently
      gsap.set(contentRef.current, { opacity: 0.15, y: 20 });
      gsap.to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      });

      // Column links stagger in
      const columns = contentRef.current!.querySelectorAll('[data-footer-col]');
      gsap.set(columns, { opacity: 0.15, y: 15 });
      gsap.to(columns, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      });

      // CTA background glow drift at 0.4x
      if (ctaGlowRef.current) {
        gsap.to(ctaGlowRef.current, {
          x: 12,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: ctaGlowRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      }

      // Top border glow activates during reveal
      if (topBorderGlowRef.current) {
        gsap.set(topBorderGlowRef.current, { opacity: 0 });
        gsap.to(topBorderGlowRef.current, {
          opacity: 1,
          duration: 1.0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });
      }
    }, contentRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="relative border-t border-white/[0.04]">
      {/* Top border glow — activates during reveal */}
      <div
        ref={topBorderGlowRef}
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(32,170,182,0.15) 50%, transparent 90%)",
          boxShadow: "0 0 10px rgba(108,99,255,0.05)",
          willChange: "opacity",
        }}
      />

      {/* Top CTA band */}
      <div className="relative py-16 sm:py-20 overflow-hidden">
        <div ref={ctaGlowRef} className="absolute inset-0 bg-[#20aab6]/[0.03] pointer-events-none" style={{ willChange: "transform" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-2xl sm:text-3xl font-bold"
            layout={false}
          >
            <span className="text-white">
              Ready to get started?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-3 text-sm sm:text-base text-white/40 max-w-md mx-auto"
            layout={false}
          >
            Join institutions worldwide using PSI for secure, compliant
            cross-border payments and digital asset infrastructure.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-6 flex justify-center gap-3"
            layout={false}
          >
            <Link href="/get-started">
              <button className="btn-glow px-7 py-3 rounded-full text-sm font-semibold text-white">
                Begin Onboarding
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Main footer content */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ willChange: "transform, opacity" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand column */}
          <div data-footer-col className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#20aab6] flex items-center justify-center font-bold text-white text-xs">
                P
              </div>
              <span className="text-white font-semibold text-base tracking-wide">
                PSI
              </span>
            </Link>
            <p className="mt-4 text-xs sm:text-sm text-white/30 leading-relaxed max-w-xs">
              Payment Solutions International — bridging traditional finance and
              digital assets for global commerce.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} data-footer-col>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-white/30 hover:text-white/60 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        <div className="py-6 flex flex-wrap gap-4 sm:gap-6 justify-center">
          {["SOC 2 Compliant", "Bank-grade Security"].map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              <span className="text-[10px] sm:text-xs text-white/30 font-medium">
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        <div className="py-6 sm:py-8">
          <p className="text-[10px] sm:text-xs text-white/15 leading-relaxed max-w-5xl mx-auto text-center">
            Disclaimer: PSI is a financial technology company and not a bank.
            Banking services are provided by our licensed partner institutions.
            Cryptocurrency products and services are subject to regulatory
            requirements in applicable jurisdictions. The value of digital assets
            can be volatile and you may lose some or all of your investment. Past
            performance is not indicative of future results. This website does not
            constitute financial, investment, or legal advice. Please consult with
            a qualified professional before making financial decisions. Services
            may not be available in all jurisdictions. PSI is registered and
            operates in compliance with applicable money transmission and virtual
            asset service provider regulations.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] sm:text-xs text-white/20">
            © {new Date().getFullYear()} Payment Solutions International Ltd. All
            rights reserved.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <Link
              href="/legal/privacy"
              className="text-[10px] sm:text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/legal/terms"
              className="text-[10px] sm:text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/legal/aml"
              className="text-[10px] sm:text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              AML Policy
            </Link>
            <Link
              href="/legal/cookies"
              className="text-[10px] sm:text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/legal/risk"
              className="text-[10px] sm:text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Risk Disclosure
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
