"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const cardBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px) saturate(150%)",
  WebkitBackdropFilter: "blur(12px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const cardSelected: React.CSSProperties = {
  border: "1px solid rgba(32,170,182,0.5)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(32,170,182,0.15)",
};

export default function SignupPageWrapper() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}

function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"individual" | "business" | null>(null);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "individual" || type === "business") setRole(type);
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!role) {
      setError("Select Individual or Business account type");
      return;
    }

    setLoading(true);
    try {
      const user = await signup(email, password, name, role);
      UserService.setUser(user);
      // Store email for the check-email page
      sessionStorage.setItem("psi_pending_email", email);
      router.push("/check-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
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
        <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/images/psi-logo-nav.png" alt="PSI" className="h-20 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-white/40 text-[14px] mt-2">Join PSI — it&apos;s free</p>
        </motion.div>

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

          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-white/60 mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={inputBase}
              autoComplete="name"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-white/60 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputBase}
              autoComplete="new-password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] font-medium text-white/60 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={`${inputBase} ${confirmPassword && confirmPassword !== password ? "!border-red-500 !focus:border-red-500" : ""}`}
              autoComplete="new-password"
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Account type */}
          <div>
            <label className="block text-[13px] font-medium text-white/60 mb-2.5">Account type</label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: "individual" as const, title: "Individual", desc: "Personal use" },
                  { key: "business" as const, title: "Business", desc: "Company account" },
                ]
              ).map((opt) => {
                const isSel = role === opt.key;
                return (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => setRole(opt.key)}
                    className={`rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 outline-none ${isSel ? "" : role ? "opacity-50" : "hover:opacity-80"}`}
                    style={isSel ? { ...cardBase, ...cardSelected } : cardBase}
                  >
                    <span className="text-sm font-semibold text-white">{opt.title}</span>
                    <span className="text-[11px] text-white/40 mt-1">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={loading ? {} : { scale: 1.02, y: -1 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            className="w-full relative overflow-hidden px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-gradient-accent shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account…
              </span>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </motion.form>

        <motion.p custom={2} variants={fadeInUp} initial="hidden" animate="visible" className="text-center text-sm text-white/30 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#20aab6] hover:underline">Sign in</Link>
        </motion.p>
      </div>
    </main>
  );
}
