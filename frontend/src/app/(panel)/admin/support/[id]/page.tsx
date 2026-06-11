"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ── Types ──
interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: "user" | "admin";
  sender_name: string;
  body: string;
  created_at: string;
  attachments: TicketAttachment[];
}

interface TicketAttachment {
  id: number;
  filename: string;
  file_url: string;
  mime_type: string;
}

interface TicketDetail {
  id: number;
  ref_id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  category: string;
  subject: string;
  status: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role?: string;
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

const QUICK_LINKS: Record<string, { label: string; href: string } | null> = {
  kyc_issue: { label: "View KYC Submission →", href: "/admin/kyc-queue" },
  payment_issue: { label: "View Payments →", href: "/admin/payments-review" },
  crypto_purchase_issue: { label: "View Crypto Purchases →", href: "/admin/crypto-purchases" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  useAuth(); // auth guard

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Confirmation modal state
  const [confirmClose, setConfirmClose] = useState(false);

  // Assign state
  const [assignTo, setAssignTo] = useState("");

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const ticket = data.ticket || data;
        setTicket({ ...ticket, messages: data.messages || [] });
        setAssignTo(ticket.assigned_to_id ? String(ticket.assigned_to_id) : "");
      }
    } catch (err) {
      console.error("Failed to fetch ticket:", err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchAdminUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users?limit=100`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Extract array of users from the response
        const users = data.users || data || [];
        setAdminUsers(
          users
            .filter((u: AdminUser) => u.role === "admin")
            .map((u: AdminUser) => ({ id: u.id, name: u.name, email: u.email }))
        );
      }
    } catch {
      // Admin users fetch is optional
    }
  }, []);

  useEffect(() => {
    fetchTicket();
    fetchAdminUsers();
  }, [fetchTicket, fetchAdminUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    if (newStatus === "closed") {
      setConfirmClose(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTicket({ ...ticket, status: newStatus });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const confirmCloseTicket = async () => {
    if (!ticket) return;
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) {
        setTicket({ ...ticket, status: "closed" });
      }
    } catch (err) {
      console.error("Failed to close ticket:", err);
    } finally {
      setConfirmClose(false);
    }
  };

  const handleAssign = async () => {
    if (!ticket) return;
    try {
      const body = assignTo ? { assigned_to_id: Number(assignTo) } : { assigned_to_id: null };
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to assign ticket:", err);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("body", reply.trim());
      files.forEach((f) => formData.append("attachments", f));

      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/messages`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        setReply("");
        setFiles([]);
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-text-phantom text-sm">Loading ticket…</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <p className="text-text-muted text-sm">Ticket not found.</p>
        <button onClick={() => router.push("/admin/support")} className="text-accent text-sm mt-2 hover:underline">
          ← Back to Support
        </button>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      {/* Back link */}
      <button
        onClick={() => router.push("/admin/support")}
        className="text-text-muted hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← Back to Support
      </button>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left panel — messages */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-accent font-mono text-sm">{ticket.ref_id}</span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                {STATUS_LABELS[ticket.status] || ticket.status}
              </span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS.other}`}>
                {CATEGORY_LABELS[ticket.category] || ticket.category}
              </span>
            </div>
            <h1 className="text-white text-lg font-bold">{ticket.subject}</h1>
          </div>

          {/* Message thread */}
          <div className="space-y-4 mb-6">
            <AnimatePresence mode="popLayout">
              {(ticket.messages || []).map((msg) => {
                const isAdmin = msg.sender_type === "admin";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        isAdmin
                          ? "bg-accent-fill/50 border border-accent/20 rounded-2xl rounded-bl-md mr-12 p-4"
                          : "bg-fill-subtle border border-border-default rounded-2xl rounded-br-md ml-12 p-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isAdmin ? "text-accent" : "text-white"}`}>
                          {msg.sender_name}
                        </span>
                        <span className="text-text-phantom text-xs">{formatDate(msg.created_at)}</span>
                      </div>
                      <p className="text-text-secondary text-sm whitespace-pre-wrap">{msg.body}</p>

                      {/* Attachments */}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.attachments.map((att) =>
                            att.mime_type?.startsWith("image/") ? (
                              <img
                                key={att.id}
                                src={att.file_url}
                                alt={att.filename}
                                className="mx-auto max-w-[280px] max-h-[280px] rounded-lg border border-white/10"
                              />
                            ) : (
                              <a
                                key={att.id}
                                href={att.file_url}
                                download={att.filename}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-text-secondary text-xs hover:bg-white/[0.08] transition-colors w-fit"
                              >
                                <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                {att.filename}
                              </a>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          {!isClosed ? (
            <div className="bg-surface-1 border border-border-default rounded-xl p-4">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 resize-none min-h-[80px]"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative p-2 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    {files.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                        {files.length}
                      </span>
                    )}
                  </button>
                  {files.length > 0 && (
                    <span className="text-text-phantom text-xs">
                      {files.map((f) => f.name).join(", ")}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSendReply}
                  disabled={!reply.trim() || sending}
                  className="bg-accent text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-1 border border-border-default rounded-xl p-4 text-center">
              <p className="text-text-dim text-sm">This ticket has been closed. No further replies can be sent.</p>
            </div>
          )}
        </div>

        {/* Right panel — details */}
        <div className="w-80 shrink-0 space-y-4">
          {/* Ticket Details */}
          <div className="bg-surface-1 border border-border-default rounded-xl p-5">
            <h3 className="text-text-dim text-xs uppercase tracking-wider mb-4">Ticket Details</h3>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-text-phantom text-xs mb-1 block">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 appearance-none"
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-gray-900">{label}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-text-phantom text-xs mb-1 block">Category</label>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </span>
              </div>

              {/* Created at */}
              <div>
                <label className="text-text-phantom text-xs mb-1 block">Created</label>
                <p className="text-text-secondary text-sm">{formatDate(ticket.created_at)}</p>
              </div>

              {/* Last updated */}
              <div>
                <label className="text-text-phantom text-xs mb-1 block">Last Updated</label>
                <p className="text-text-secondary text-sm">{relativeTime(ticket.updated_at)}</p>
              </div>

              {/* View user profile link */}
              <a
                href={`/admin/users?id=${ticket.user_id}`}
                className="text-accent text-xs hover:underline block pt-2 border-t border-white/[0.04]"
              >
                View User Profile →
              </a>
            </div>
          </div>

          {/* Assign Ticket */}
          <div className="bg-surface-1 border border-border-default rounded-xl p-5">
            <h3 className="text-text-dim text-xs uppercase tracking-wider mb-3">Assign Ticket</h3>
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 appearance-none mb-3"
            >
              <option value="" className="bg-gray-900">Unassigned</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={String(u.id)} className="bg-gray-900">{u.name}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white font-medium hover:bg-white/[0.1] transition-colors"
            >
              {ticket.assigned_to_name ? "Reassign" : "Assign"}
            </button>
          </div>

          {/* Quick Links */}
          {QUICK_LINKS[ticket.category] && (
            <div className="bg-surface-1 border border-border-default rounded-xl p-5">
              <h3 className="text-text-dim text-xs uppercase tracking-wider mb-3">Quick Links</h3>
              <a
                href={QUICK_LINKS[ticket.category]!.href}
                className="text-accent text-sm hover:underline block py-1"
              >
                {QUICK_LINKS[ticket.category]!.label}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Close confirmation modal */}
      <AnimatePresence>
        {confirmClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setConfirmClose(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-1 border border-border-default rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-white font-bold text-lg mb-2">Close Ticket?</h3>
              <p className="text-text-secondary text-sm mb-6">
                This will mark the ticket as closed and prevent further replies. Are you sure?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmClose(false)}
                  className="px-4 py-2 rounded-lg text-sm text-text-dim bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCloseTicket}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  Close Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
