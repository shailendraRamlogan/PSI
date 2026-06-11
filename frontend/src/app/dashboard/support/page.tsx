"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

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

const STATUS_BADGE: Record<string, string> = {
  open: "bg-green-500/10 text-green-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  resolved: "bg-amber-500/10 text-amber-400",
  closed: "bg-gray-500/10 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const FILTERS = ["all", "open", "in_progress", "resolved", "closed"] as const;

interface Ticket {
  id: string;
  ref_id: string;
  category: string;
  subject: string;
  status: string;
  latest_message_preview?: string;
  updated_at: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/support/tickets`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setTickets(Array.isArray(data) ? data : data.tickets ?? []);
        }
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Support</h1>
          <p className="text-text-dim text-sm mt-1">Get help from our team</p>
        </div>
        <Link
          href="/dashboard/support/new"
          className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all"
        >
          New Ticket
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
              filter === f
                ? "bg-accent-fill text-accent"
                : "text-text-muted hover:text-text-secondary hover:bg-fill-faint"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-1 border border-border-default rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-fill-faint rounded w-1/3 mb-3" />
              <div className="h-3 bg-fill-faint rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <svg className="w-16 h-16 text-text-phantom mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <h3 className="text-white font-medium text-lg mb-1">No support tickets yet</h3>
          <p className="text-text-dim text-sm mb-6">Need help? Create a ticket and we&apos;ll get back to you.</p>
          <Link
            href="/dashboard/support/new"
            className="px-6 py-3 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all"
          >
            Create Ticket
          </Link>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                className="bg-surface-1 border border-border-default rounded-xl p-4 cursor-pointer hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-accent font-mono text-xs">{ticket.ref_id}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS.other}`}>
                        {CATEGORY_LABELS[ticket.category] ?? "Other"}
                      </span>
                    </div>
                    <p className="text-white font-medium text-sm mb-1 truncate">{ticket.subject}</p>
                    {ticket.latest_message_preview && (
                      <p className="text-text-dim text-xs truncate">{ticket.latest_message_preview}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.closed}`}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                    <span className="text-text-phantom text-xs">{relativeTime(ticket.updated_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
