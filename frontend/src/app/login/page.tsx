"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth, UserService } from "@/lib/auth-store";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const inputBase =
  "w-full bg-[#1a1a1a] border border-white/[0.12] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#20aab6] focus:shadow-[0_0_0_3px_rgba(32,170,182,0.12)]";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [onPanel, setOnPanel] = useState(false);

  useEffect(() => {
    setOnPanel(typeof window !== "undefined" && window.location.hostname === "psi-panel.ourea.tech");
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);

      // Panel: reject non-admins and immediately invalidate session
      if (onPanel && user.role !== "admin") {
        // Clear cookies server-side
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        // Clear client-side session
        sessionStorage.removeItem("psi_user");
        setError("Admin access required. Use psi.ourea.tech for your account.");
        return;
      }

      // Commit session to client storage (after all checks pass)
      UserService.setUser(user);
      router.push(onPanel ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#07080F] text-white min-h-screen antialiased flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #20aab6 0%, transparent 70%)", top: "10%", left: "50%", transform: "translateX(-50%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Logo + heading */}
        <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#20aab6] flex items-center justify-center font-bold text-white text-sm">
              P
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">PSI</span>
          </Link>
          <h1 className="text-2xl font-bold">{onPanel ? "Admin Portal" : "Welcome back"}</h1>
          <p className="text-white/40 text-[14px] mt-2">{onPanel ? "Sign in with your admin credentials" : "Sign in to your PSI account"}</p>
        </motion.div>

        {/* Form */}
        <motion.form
          custom={1} variants={fadeInUp} initial="hidden" animate="visible"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-white/60 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputBase}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-white/60 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputBase}
              autoComplete="current-password"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[#20aab6] text-[13px] hover:underline">
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={loading ? {} : { scale: 1.02, y: -1 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            className="w-full relative overflow-hidden px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </motion.form>

        <motion.p custom={2} variants={fadeInUp} initial="hidden" animate="visible" className="text-center text-sm text-white/30 mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#20aab6] hover:underline">Create one</Link>
        </motion.p>
      </div>
    </main>
  );
}
