"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // ─── GSAP Global Configuration (Task 1 + 8) ───
  gsap.defaults({
    ease: "power2.out",
    duration: 0.8,
    overwrite: "auto",
  });

  ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
  });
}

/* ─── ScrollAnimationProvider ─── */
export function ScrollAnimationProvider({ children }: { children: React.ReactNode }) {
  const ambientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enable smooth scrolling via CSS
    document.documentElement.style.scrollBehavior = "smooth";

    // ─── Debounced ScrollTrigger.refresh() on resize (Task 5) ───
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Refresh ScrollTrigger after fonts/images load
    const onLoaded = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoaded);

    // ─── Global ambient lighting — desktop only, GPU-accelerated (Task 3 + 7) ───
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    let ambientTween: gsap.core.Tween | null = null;
    if (ambientRef.current && !isMobile) {
      ambientTween = gsap.to(ambientRef.current, {
        y: 200,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.0,
          invalidateOnRefresh: true,
        },
      });
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoaded);
      clearTimeout(resizeTimer);
      if (ambientTween) {
        ambientTween.scrollTrigger?.kill();
        ambientTween.kill();
      }
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      {/* Global ambient lighting layer — fixed behind all sections. Hidden on mobile for perf (Task 7) */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] hidden sm:block"
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
          transform: "translate3d(0, 0, 0)",
        }}
      >
        <div
          ref={ambientRef}
          className="absolute inset-0"
          style={{ willChange: "transform", backfaceVisibility: "hidden" }}
        >
          {/* Purple glow */}
          <div
            className="absolute"
            style={{
              width: "120vw",
              height: "60vh",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(108,99,255,0.04) 0%, transparent 60%)",
              left: "-10vw",
              top: "20vh",
            }}
          />
          {/* Amber glow */}
          <div
            className="absolute"
            style={{
              width: "80vw",
              height: "50vh",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(247,147,26,0.025) 0%, transparent 55%)",
              right: "-5vw",
              top: "40vh",
            }}
          />
          {/* Blue glow */}
          <div
            className="absolute"
            style={{
              width: "90vw",
              height: "55vh",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(39,117,202,0.03) 0%, transparent 55%)",
              left: "5vw",
              top: "60vh",
            }}
          />
        </div>
      </div>
      {children}
    </>
  );
}

/* ─── useGSAPScrollTrigger ─── */
export function useGSAPScrollTrigger(
  callback: (self: ScrollTrigger) => void,
  deps: React.DependencyList = []
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 85%",
      end: "bottom 15%",
      invalidateOnRefresh: true,
      onUpdate: callback,
    });

    return () => {
      trigger.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);

  return ref;
}

/* ─── useParallax ─── */
export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const adjustedSpeed = isMobile ? speed * 0.5 : speed;

    const tl = gsap.to(el, {
      y: () => el.offsetHeight * adjustedSpeed * -0.3,
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [speed]);

  return ref;
}

/* ─── useScrollFadeOut ─── */
export function useScrollFadeOut(startOpacity: number = 1) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const tl = gsap.fromTo(
      el,
      { opacity: startOpacity },
      {
        opacity: 0,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      }
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [startOpacity]);

  return ref;
}

/* ─── useStaggerReveal ─── */
export function useStaggerReveal(
  selector: string,
  options: {
    y?: number;
    stagger?: number;
    start?: string;
    scrub?: boolean | number;
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const { y = 30, stagger = 0.06, start = "top 80%", scrub = false } = options;

  useEffect(() => {
    if (!ref.current) return;

    const els = ref.current.querySelectorAll(selector);
    if (els.length === 0) return;

    gsap.set(els, { opacity: 0.15, y });

    const tl = gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger,
      ease: "power2.out",
      force3D: true,
      scrollTrigger: {
        trigger: ref.current,
        start,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [selector, y, stagger, start, scrub]);

  return ref;
}

/* ─── useParallaxDepth — Layered depth parallax ─── */
export function useParallaxDepth(
  speed: number = 0.5,
  options: {
    direction?: 'y' | 'x' | 'both';
    scrub?: number;
    range?: number;
    trigger?: React.RefObject<HTMLElement>;
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const { direction = 'y', scrub = 0.8, range, trigger } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const speedMult = isMobile ? 0.5 : 1;

    const triggerEl = trigger?.current || el;
    const displacement = range !== undefined
      ? range * speedMult
      : el.offsetHeight * speed * -0.3 * speedMult;

    const vars: gsap.TweenVars = {
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: triggerEl,
        start: "top bottom",
        end: "bottom top",
        scrub,
        invalidateOnRefresh: true,
      },
    };

    if (direction === 'y') vars.y = displacement;
    else if (direction === 'x') vars.x = displacement;
    else {
      vars.y = displacement;
      vars.x = displacement * 0.3;
    }

    const tl = gsap.to(el, vars);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [speed, direction, scrub, range, trigger]);

  return ref;
}

/* ─── useScrollProgress — Returns 0-1 progress for a trigger element (ref-based, no re-renders) ─── */
export function useScrollProgress(
  options: {
    trigger?: React.RefObject<HTMLElement>;
    start?: string;
    end?: string;
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const callbackRef = useRef<((progress: number) => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: options.trigger?.current || el,
      start: options.start || "top top",
      end: options.end || "bottom top",
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        callbackRef.current?.(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [options.trigger, options.start, options.end]);

  return { ref, progressRef, callbackRef };
}

/* ─── useScrollReactiveGlow — dims glow as section exits, brightens as enters ─── */
export function useScrollReactiveGlow(
  glowSelector: string = "[data-section-glow]"
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const glows = el.querySelectorAll(glowSelector);
    if (glows.length === 0) return;

    const ctx = gsap.context(() => {
      glows.forEach((glow) => {
        gsap.fromTo(
          glow,
          { opacity: 0.3 },
          {
            opacity: 1,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "top 30%",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          }
        );
        // Dim when scrolling out
        gsap.to(glow, {
          opacity: 0.3,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: el,
            start: "bottom 40%",
            end: "bottom top",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [glowSelector]);

  return ref;
}

/* ─── CinematicTransition — atmospheric blending between sections ─── */
export function CinematicTransition({
  fromColor = "rgba(7,8,15,0)",
  toColor = "rgba(7,8,15,0)",
  glowColor = "rgba(108,99,255,0.03)",
}: {
  fromColor?: string;
  toColor?: string;
  glowColor?: string;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const glow = glowRef.current;

    // Fade the transition in as it enters viewport
    gsap.set(el, { opacity: 0 });
    const tl = gsap.to(el, {
      opacity: 1,
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        end: "center center",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });

    // Subtle parallax on the glow layer (0.3x)
    if (glow) {
      gsap.to(glow, {
        y: -8,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative h-10 sm:h-14 pointer-events-none"
      style={{
        willChange: "opacity",
        backfaceVisibility: "hidden",
        contain: "layout style",
      }}
    >
      {/* Atmospheric top fade */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background: `linear-gradient(to bottom, ${fromColor}, transparent)`,
        }}
      />
      {/* Atmospheric bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: `linear-gradient(to top, ${toColor}, transparent)`,
        }}
      />
      {/* Central atmospheric glow */}
      <div
        ref={glowRef}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
          transform: "translate3d(0, -50%, 0)",
        }}
      >
        <div
          className="mx-auto h-[1px]"
          style={{
            width: "60%",
            background: `linear-gradient(90deg, transparent, ${glowColor.replace(/\d+\)$/, "0.25)")}, transparent)`,
            boxShadow: `0 0 30px ${glowColor.replace(/\d+\)$/, "0.15)")}`,
          }}
        />
      </div>
      {/* Ambient light spill */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${glowColor}, transparent)`,
        }}
      />
    </div>
  );
}
