"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "B2B", href: "/b2b" },
    { label: "Individuals", href: "/individuals" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-strong shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 rounded-lg bg-[#20aab6] flex items-center justify-center font-bold text-white text-sm overflow-hidden group-hover:shadow-lg group-hover:shadow-[#20aab6]/20 transition-shadow duration-300">
              P
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">
              PSI
            </span>
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#20aab6] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right side buttons — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button className="btn-outline px-5 py-2 rounded-full text-sm text-white/80 hover:text-white font-medium">
                Login
              </button>
            </Link>
            <Link href="/get-started">
              <button className="btn-glow px-5 py-2 rounded-full text-sm font-medium text-white">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="w-5 h-[1.5px] bg-white/70 block"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-5 h-[1.5px] bg-white/70 block"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="w-5 h-[1.5px] bg-white/70 block"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden glass-strong overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white py-2 text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/5" />
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <button className="w-full btn-outline px-5 py-2.5 rounded-full text-sm text-white/80 font-medium">
                  Login
                </button>
              </Link>
              <Link href="/get-started" onClick={() => setMobileOpen(false)}>
                <button className="w-full btn-glow px-5 py-2.5 rounded-full text-sm font-medium text-white">
                  Get Started
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
