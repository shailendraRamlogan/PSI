"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/kyc-queue": "KYC Queue",
  "/admin/users": "User Management",
};

interface PanelUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: "KYC Queue",
    href: "/admin/kyc-queue",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

function PanelSidebar({ user }: { user: PanelUser }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-2 px-5 pt-6 pb-8">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white text-xs">
          P
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">PSI Panel</span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent-fill/20 text-accent">Admin</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "bg-accent-fill text-accent shadow-accent"
                  : "text-text-dim hover:text-white hover:bg-fill-ghost"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 pt-3 border-t border-border-subtle">
          <div className="w-7 h-7 rounded-full bg-accent-fill flex items-center justify-center text-accent text-[11px] font-bold shrink-0">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-text-phantom truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

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

  const pageTitle = pageTitles[pathname] || "Admin Panel";

  return (
    <div className="flex h-screen bg-surface-0 text-white antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border-default bg-surface-1 flex flex-col">
        <PanelSidebar user={user} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border-default flex items-center justify-between px-6 bg-surface-0">
          <h1 className="text-sm font-medium text-text-dim">{pageTitle}</h1>
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
      </div>
    </div>
  );
}
