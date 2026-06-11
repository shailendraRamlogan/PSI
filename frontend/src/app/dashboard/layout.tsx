"use client";

import { useAuth, UserService } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./_components/Sidebar";
import { useSidebar } from "@/hooks/useSidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/payments": "Payments",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, sessionExpired, dismissSessionExpired, setUser: setAuthUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Session validity check — calls /api/auth/me with credentials: 'include'.
  // This is the correct way to check session validity when tokens are httpOnly.
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  const checkSession = useCallback(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => setSessionValid(r.ok))
      .catch(() => setSessionValid(false));
  }, []);

  useEffect(() => {
    if (sessionExpired) {
      checkSession();
    }
  }, [sessionExpired, checkSession]);

  // Refresh user data from server on every dashboard mount.
  // This ensures kyc_data and other mutable fields reflect the latest
  // server state even if the user refreshed without re-logging in.
  useEffect(() => {
    if (loading) return;
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          UserService.setUser(d.user);
          setAuthUser(d.user);
        }
      })
      .catch(() => {});
  }, [loading, setAuthUser]);

  // Show expired modal only when flag is set AND session is actually invalid
  const showExpired = sessionExpired && sessionValid === false;

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user && !sessionExpired) {
      router.replace("/login");
    }
  }, [user, loading, sessionExpired, router]);

  // Auto-redirect to login 3 seconds after session expires
  useEffect(() => {
    if (!showExpired) return;
    const timer = setTimeout(() => {
      dismissSessionExpired();
      router.replace("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [showExpired, dismissSessionExpired, router]);

  const handleExpiredLogin = () => {
    dismissSessionExpired();
    router.replace("/login");
  };

  const sidebar = useSidebar();

  const pageTitle = pageTitles[pathname] || "Dashboard";

  // ── Conditional renders (no hooks below this line) ──

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user && !sessionExpired) return null;

  return (
    <div className="flex h-screen bg-surface-0 text-white antialiased overflow-hidden">
      {/* Session Expired Modal — only show if /api/auth/me confirms 401 */}
      <AnimatePresence>
        {showExpired && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-sm bg-surface-2 border border-border-medium rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-warning-fill flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1">Session Expired</h3>
              <p className="text-[13px] text-text-dim mb-6">
                Your session has expired due to inactivity. Please sign in again to continue.
              </p>
              <button
                onClick={handleExpiredLogin}
                className="w-full px-6 py-3 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all"
              >
                Sign In Again
              </button>
              <p className="text-[11px] text-text-phantom mt-3">Redirecting to login…</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar — component owns its own width and overlay behavior */}
      <Sidebar isOpen={sidebar.isOpen} isMobile={sidebar.isMobile} onClose={sidebar.close} onToggle={sidebar.toggle} />

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
              {user?.name?.[0]?.toUpperCase() || "U"}
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
