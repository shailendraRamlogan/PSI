"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeadingReveal } from "@/lib/section-choreography";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const faqs = [
  {
    question: "How do I access your service?",
    answer:
      "Simply click 'Get Started' to begin the onboarding process. You'll complete a quick KYC verification, and once approved, you'll have full access to our platform's suite of payment, conversion, and liquidity tools within 24–48 hours.",
  },
  {
    question: "What are your fees?",
    answer:
      "Our fees are competitive and transparent. Currency conversion fees start at 1.5%, with volume-based discounts available for enterprise clients. There are no hidden charges — all fees are disclosed upfront before you confirm any transaction.",
  },
  {
    question: "Can I access my money internationally?",
    answer:
      "Yes. With our Visa rail card and stablecoin infrastructure, you can access your funds from anywhere in the world. Use ATMs for cash withdrawals or make online and in-person purchases globally.",
  },
  {
    question:
      "How many days does it take from onboarding fiat to get USD or cryptocurrency liquidity?",
    answer:
      "Once your account is verified and funded, fiat-to-USD conversions typically settle within 1–2 business days. Fiat-to-stablecoin conversions can settle in as little as a few hours, depending on the on-ramp method used.",
  },
  {
    question: "How long does it take for remittances?",
    answer:
      "Stablecoin-based remittances can settle in minutes. Traditional fiat remittances via our partner corridors typically complete within 1–3 business days, significantly faster than legacy wire transfer methods.",
  },
];

function FaqItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      layout={false}
    >
      <button
        onClick={onToggle}
        className={`w-full text-left rounded-xl transition-all duration-300 group ${
          isOpen
            ? "glass-strong shadow-lg shadow-black/20"
            : "hover:bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5">
          <span
            className={`text-sm sm:text-base font-medium pr-4 transition-colors duration-300 ${
              isOpen ? "text-white" : "text-white/60 group-hover:text-white/80"
            }`}
          >
            {faq.question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isOpen
                ? "bg-gradient-to-br from-[#6c63ff] to-[#3b82f6]"
                : "bg-white/[0.04] group-hover:bg-white/[0.08]"
            }`}
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-4" />
              <p className="text-sm text-white/40 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const headingChoreographyRef = useHeadingReveal();
  const listRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const glowLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;

    const items = listRef.current.querySelectorAll('[data-faq-item]');
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0.15, x: -20 });
      gsap.to(items, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      });

      // Glow line "draws" from width 0 to 100% as items reveal
      if (glowLineRef.current) {
        gsap.set(glowLineRef.current, { scaleX: 0, transformOrigin: "left center" });
        gsap.to(glowLineRef.current, {
          scaleX: 1,
          duration: 1.2,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });
      }

      // Divider glow drift at 0.4x
      if (dividerRef.current) {
        gsap.to(dividerRef.current, {
          x: 10,
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
    }, listRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Divider */}
      <div ref={dividerRef} data-section-glow className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#6c63ff]/20 to-transparent" style={{ willChange: "transform" }} />

      <div ref={sectionRef} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading — clip-path choreography */}
        <div
          ref={headingChoreographyRef}
          className="text-center mb-12 sm:mb-16"
        >
          <p
            data-eyebrow
            className="text-xs uppercase tracking-[0.2em] text-[#6c63ff]/80 font-medium mb-4"
            style={{ willChange: "transform, opacity" }}
          >
            Frequently asked questions
          </p>
          <h2
            data-heading
            className="text-2xl sm:text-3xl lg:text-4xl font-bold"
            style={{ willChange: "clip-path" }}
          >
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Everything you need to know
            </span>
          </h2>
        </div>

        {/* Glow line that draws during reveal */}
        <div className="flex justify-center mb-8">
          <div
            ref={glowLineRef}
            className="h-[2px] w-full max-w-xs rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(108,99,255,0.2), transparent)",
              willChange: "transform",
            }}
          />
        </div>

        {/* FAQ items */}
        <div ref={listRef} className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} data-faq-item style={{ willChange: "transform, opacity" }}>
              <FaqItem
                faq={faq}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgb(7,8,15))" }} />
    </section>
  );
}
