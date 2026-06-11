"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "", width: "0%" };
    if (password.length < 8) return { label: "Too short", color: "bg-red-500", width: "20%" };
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "40%" };
    if (score <= 3) return { label: "Fair", color: "bg-amber-500", width: "65%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (invalidToken) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-[400px] px-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/images/psi-logo-nav.png" alt="PSI" className="h-9 w-auto" />
        </Link>

        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-red-400">Invalid reset link</h1>
        <p className="text-white/40 text-sm mt-2">This link is missing a valid token.</p>
        <Link href="/forgot-password" className="inline-block mt-6 text-[#20aab6] text-sm hover:underline">
          Request a new reset link
        </Link>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-[400px] px-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-emerald-400">Password reset!</h1>
        <p className="text-white/40 text-sm mt-2">Your password has been updated. Redirecting to sign in…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 w-full max-w-[400px] px-6"
    >
      <Link href="/" className="inline-flex items-center gap-2 mb-8">
        <img src="/images/psi-logo-nav.png" alt="PSI" className="h-9 w-auto" />
      </Link>

      <h1 className="text-2xl font-bold">Set new password</h1>
      <p className="text-white/40 text-[14px] mt-2">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-white/60 text-[13px] mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#20aab6]/50 focus:ring-1 focus:ring-[#20aab6]/25 transition-colors pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="mt-2">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
              </div>
              <p className="text-[11px] mt-1 text-white/30">{strength.label}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-white/60 text-[13px] mb-1.5">Confirm new password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
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
          className="w-full relative overflow-hidden px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-gradient-accent shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Resetting…
            </span>
          ) : (
            "Reset password"
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
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
      <Suspense fallback={<div className="text-white/40 text-sm">Loading…</div>}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
