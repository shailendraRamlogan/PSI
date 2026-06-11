"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
// useAuth used for auth guard — credentials via httpOnly cookies

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ── Types ──
interface TicketRow {
  id: number;
  ref_id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  category: string;
  subject: string;
  status: string;
  assigned_to_name: string | null;
  updated_at: string;
  created_at: string;
}

interface Stats {
  open: number;
  in_progress: number;
  resolved_today: number;
  avg_response: string | null;
}

// ── Mappings ──
const CATEGORY_LABELS: Record<string, string> = {
  general_inquiry: "General Inquiry",
  kyc_issue: "KYC Issue",
  payment_issue: "Payment Issue",
  crypto_purchase_issue: "Crypto Purchase Issue",
  technical_issue: "Technical Issue",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  general_inquiry: "bg-blue-500/10 text-blue-400",
  kyc_issue: "bg-amber-500/10 text-amber-400",
  payment_issue: "bg-orange-500/10 text-orange-400",
  crypto_purchase_issue: "bg-purple-500/10 text-purple-400",
  technical_issue: "bg-red-500/10 text-red-400",
  other: "bg-gray-500/10 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  resolved: "bg-amber-500/10 text-amber-400",
  closed: "bg-gray-500/10 text-gray-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeTime(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function AdminSupportPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, in_progress: 0, resolved_today: 0, avg_response: null });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const [ticketsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/support/tickets?${params}`, { credentials: "include" }),
        fetch(`${API_BASE}/admin/support/tickets/stats`, { credentials: "include" }),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || data || []);
        setTotalPages(data.total_pages || 1);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Support Tickets</h1>
        <p className="text-text-dim text-sm mt-1">Manage and respond to user support requests</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Open", value: stats.open },
          { label: "In Progress", value: stats.in_progress },
          { label: "Resolved Today", value: stats.resolved_today },
          { label: "Avg Response Time", value: stats.avg_response || "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-surface-1 border border-border-default rounded-xl p-4"
          >
            <p className="text-text-dim text-xs uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-white text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by reference, subject, user..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 appearance-none min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 appearance-none min-w-[200px]"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Ticket table */}
      <div className="bg-surface-1 border border-border-default rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-fill-faint">
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Reference</th>
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">User</th>
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Category</th>
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Subject</th>
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Status</th>
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Assigned To</th>
              <th className="text-left px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Last Updated</th>
              <th className="text-right px-4 py-3 text-text-dim text-xs uppercase tracking-wider font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-phantom text-sm">
                  Loading tickets…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-phantom text-sm">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-white/[0.04] hover:bg-fill-faint transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/support/${t.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="text-accent font-mono text-xs">{t.ref_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{t.user_name || "Unknown"}</p>
                    <p className="text-text-phantom text-xs">{t.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.other}`}>
                      {CATEGORY_LABELS[t.category] || t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm max-w-[200px] truncate">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || STATUS_COLORS.open}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {t.assigned_to_name ? (
                      <span className="text-text-secondary">{t.assigned_to_name}</span>
                    ) : (
                      <span className="text-text-phantom">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-dim text-xs">{relativeTime(t.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-accent text-xs font-medium hover:underline">View</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
            <span className="text-text-phantom text-xs">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={(e) => { e.stopPropagation(); setPage((p) => p - 1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-dim bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-dim bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
