"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface Stats {
  users: { total: number; individual: number; business: number; admin: number };
  suspended: { count: number };
  pendingKyc: { count: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold">Admin Dashboard</h2>
        <p className="text-[13px] text-text-dim mt-1">Overview of platform activity and user management.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-surface-2 border border-border-subtle rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-fill/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <Link
              href="/admin/users"
              className="text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
            >
              View all →
            </Link>
          </div>
          <p className="text-2xl font-bold">{loading ? "—" : stats?.users.total ?? 0}</p>
          <p className="text-[12px] text-text-dim mt-1">Total Users</p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-subtle">
            <span className="text-[11px] text-text-phantom">
              <span className="text-blue-400 font-medium">{loading ? "—" : stats?.users.individual ?? 0}</span> Individual
            </span>
            <span className="text-[11px] text-text-phantom">
              <span className="text-purple-400 font-medium">{loading ? "—" : stats?.users.business ?? 0}</span> Business
            </span>
            <span className="text-[11px] text-text-phantom">
              <span className="text-text-dim font-medium">{loading ? "—" : stats?.users.admin ?? 0}</span> Admin
            </span>
          </div>
        </motion.div>

        {/* Suspended Users */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-surface-2 border border-border-subtle rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <Link
              href="/admin/users?status=suspended"
              className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          <p className="text-2xl font-bold">{loading ? "—" : stats?.suspended.count ?? 0}</p>
          <p className="text-[12px] text-text-dim mt-1">Suspended Users</p>
          {(stats?.suspended.count ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium bg-red-400/10 text-red-400 inset-ring inset-ring-red-400/20">
                Action required
              </span>
            </div>
          )}
        </motion.div>

        {/* Pending KYC */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-surface-2 border border-border-subtle rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Link
              href="/admin/kyc-queue"
              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Review queue →
            </Link>
          </div>
          <p className="text-2xl font-bold">{loading ? "—" : stats?.pendingKyc.count ?? 0}</p>
          <p className="text-[12px] text-text-dim mt-1">Pending KYC Reviews</p>
          {(stats?.pendingKyc.count ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium bg-amber-400/10 text-amber-400 inset-ring inset-ring-amber-400/20">
                {stats?.pendingKyc.count} awaiting review
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
