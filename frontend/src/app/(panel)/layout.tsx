"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import PanelSidebar from "./_components/PanelSidebar";
import { useSidebar } from "@/hooks/useSidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/kyc-queue": "KYC Queue",
  "/admin/users": "User Management",
  "/admin/payments-review": "Payments Review",
};

interface PanelUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Sidebar state
  const sidebar = useSidebar();

  // Validate session on mount — refresh user data from server
  useEffect(() => {
    (async () => {
      try {
        // 1. Read user from sessionStorage for immediate UI
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("psi_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.role !== "admin") {
              // Non-admin detected — invalidate session immediately
              fetch(API_BASE + "/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
              sessionStorage.removeItem("psi_user");
              router.replace("/login");
              return;
            }
            setUser(parsed);
          }
        }

        // 2. Verify session via API (cookie-based) and sync fresh user data
        const res = await fetch(API_BASE + "/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === "admin") {
            // Update both sessionStorage and React state with fresh server data
            sessionStorage.setItem("psi_user", JSON.stringify(data.user));
            setUser(data.user);
            setLoading(false);
          } else {
            // Not admin — invalidate session and redirect
            fetch(API_BASE + "/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
            sessionStorage.removeItem("psi_user");
            router.replace("/login");
          }
        } else {
          // 401 — not authenticated
          setSessionExpired(true);
          setLoading(false);
        }
      } catch {
        setSessionExpired(true);
        setLoading(false);
      }
    })();
  }, [router]);

  const pageTitle = pageTitles[pathname] || "Admin Panel";

  // ── Conditional renders (no hooks below this line) ──

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionExpired || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-surface-2 border border-border-medium rounded-2xl p-6 shadow-2xl text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-warning-fill flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-1">Session Expired</h3>
          <p className="text-[13px] text-text-dim mb-6">
            Your session has expired. Please sign in again.
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="w-full px-6 py-3 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all"
          >
            Sign In Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-0 text-white antialiased overflow-hidden">
      {/* Sidebar — component owns its own width and overlay behavior */}
      <PanelSidebar
        isOpen={sidebar.isOpen}
        isMobile={sidebar.isMobile}
        onClose={sidebar.close}
        onToggle={sidebar.toggle}
        user={user}
      />

      {/* Main area — layout animation syncs with sidebar width */}
      <motion.div
        layout
        layoutDependency={sidebar.isOpen}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0"
      >
        {/* Header */}
        <header className="h-16 border-b border-border-default flex items-center justify-between px-6 bg-surface-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={sidebar.toggle}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-white hover:bg-fill-faint transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h1 className="text-sm font-medium text-text-dim">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-fill flex items-center justify-center text-accent text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
