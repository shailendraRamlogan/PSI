"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function CheckEmailPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Read email from sessionStorage (set during signup)
  const [email] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("psi_pending_email") || "";
    }
    return "";
  });

  const handleCheck = async () => {
    setChecking(true);
    setError("");

    try {
      // Check if the httpOnly cookie session is valid and email is verified
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user?.email_verified) {
          // Store user object for the session
          if (data.user) {
            sessionStorage.setItem("psi_user", JSON.stringify(data.user));
          }
          router.push("/kyc");
          return;
        }
      }
      setError("Email not verified yet. Please check your inbox and click the verification link.");
    } catch {
      setError("Could not check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silently fail
    }
  };

  return (
    <main className="bg-[#07080F] text-white min-h-screen antialiased flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #20aab6 0%, transparent 70%)",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-[440px] px-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#20aab6] flex items-center justify-center font-bold text-white text-sm">
            P
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">PSI</span>
        </Link>

        {/* Email icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#20aab6]/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-white/40 text-[14px] mt-3 leading-relaxed">
          We sent a verification link to{" "}
          <span className="text-white/60 font-medium">{email || "your email"}</span>.
          Please click the link to activate your account.
        </p>

        {error && (
          <div className="mt-5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-400">
            {error}
          </div>
        )}

        {/* Check verification button */}
        <motion.button
          onClick={handleCheck}
          disabled={checking}
          whileHover={checking ? {} : { scale: 1.02, y: -1 }}
          whileTap={checking ? {} : { scale: 0.98 }}
          className="mt-8 w-full relative overflow-hidden px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking…
            </span>
          ) : (
            "I've verified my email"
          )}
        </motion.button>

        {/* Resend link */}
        <p className="text-white/30 text-[13px] mt-6">
          Didn&apos;t receive the email?{" "}
          <button onClick={handleResend} className="text-[#20aab6] hover:underline">
            Resend
          </button>
        </p>

        <p className="text-white/20 text-xs mt-8">
          <Link href="/login" className="hover:text-white/40">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
