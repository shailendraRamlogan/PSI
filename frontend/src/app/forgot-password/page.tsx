"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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
        className="relative z-10 w-full max-w-[400px] px-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#20aab6] flex items-center justify-center font-bold text-white text-sm">
            P
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">PSI</span>
        </Link>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold">Forgot password?</h1>
            <p className="text-white/40 text-[14px] mt-2 leading-relaxed">
              Enter the email associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-white/60 text-[13px] mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#20aab6]/50 focus:ring-1 focus:ring-[#20aab6]/25 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-[13px]">{error}</p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative overflow-hidden px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  "Send reset link"
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#20aab6]/10 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-white/40 text-[14px] mt-2 leading-relaxed">
              We sent a password reset link to <span className="text-white/60 font-medium">{email}</span>. The link expires in 1 hour and can only be used once.
            </p>
          </>
        )}

        <p className="text-white/30 text-[13px] mt-8">
          <Link href="/login" className="text-[#20aab6] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
