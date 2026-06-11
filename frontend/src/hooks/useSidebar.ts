"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DESKTOP_BREAKPOINT = 1024;
const STORAGE_KEY = "psi_sidebar_open";

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  isMobile: boolean;
  isOverlay: boolean;
}

function readStorage(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  return raw === "1";
}

function writeStorage(value: boolean) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
}

export function useSidebar(): SidebarState {
  const [isMobile, setIsMobile] = useState(false);
  const manuallyToggled = useRef(false);

  // Determine initial open state:
  // 1. If user has a persisted desktop preference, use it
  // 2. Otherwise, open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(() => {
    const stored = readStorage();
    if (stored !== null) return stored;
    return typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT;
  });

  // Sync isMobile with viewport width
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < DESKTOP_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        // Desktop: if no manual toggle yet, respect viewport default
        if (!manuallyToggled.current) {
          setIsOpen(true);
        }
      } else {
        // Mobile: always default to closed unless explicitly toggled
        setIsOpen(false);
      }
    };
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggle = useCallback(() => {
    manuallyToggled.current = true;
    setIsOpen((prev) => {
      const next = !prev;
      // Only persist on desktop
      if (typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT) {
        writeStorage(next);
      }
      return next;
    });
  }, []);

  const close = useCallback(() => {
    manuallyToggled.current = true;
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    toggle,
    close,
    isMobile,
    isOverlay: isMobile,
  };
}
