"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * useHeadingReveal — Art-directed clip-path heading reveal choreography
 *
 * Expects the container to have children with data attributes:
 *   [data-eyebrow]  — small uppercase label
 *   [data-heading]  — main heading text
 *   [data-subtitle] — description/subtitle
 *
 * Animation sequence:
 *   1. Eyebrow slides in from left (translateX: -20px) + fade
 *   2. Heading unmasks via clipPath left-to-right
 *   3. Subtitle fades in with slight translateY
 */
export function useHeadingReveal(options?: { start?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow = el!.querySelector("[data-eyebrow]") as HTMLElement;
      const heading = el!.querySelector("[data-heading]") as HTMLElement;
      const subtitle = el!.querySelector("[data-subtitle]") as HTMLElement;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: options?.start || "top 82%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      });

      // Eyebrow: slide from left + fade (transform only — GPU)
      if (eyebrow) {
        gsap.set(eyebrow, { opacity: 0.1, x: -20 });
        tl.to(eyebrow, {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          force3D: true,
        }, 0);
      }

      // Heading: clip-path unmask from left to right (GPU-composited)
      if (heading) {
        gsap.set(heading, {
          opacity: 1,
          clipPath: "inset(0 100% 0 0)",
          willChange: "clip-path",
        });
        tl.to(heading, {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.0,
          ease: "power2.out",
        }, eyebrow ? 0.15 : 0);
      }

      // Subtitle: fade + slight translateY (transform + opacity — GPU)
      if (subtitle) {
        gsap.set(subtitle, { opacity: 0.1, y: 10 });
        tl.to(subtitle, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          force3D: true,
        }, heading ? ">-=0.2" : 0.3);
      }
    }, el);

    return () => ctx.revert();
  }, [options?.start]);

  return ref;
}
