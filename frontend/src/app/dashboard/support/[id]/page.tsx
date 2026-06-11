"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

interface Attachment {
  id?: string;
  url: string;
  filename: string;
  mime_type: string;
}

interface Message {
  id: string;
  sender_type: "user" | "admin";
  sender_name: string;
  body: string;
  attachments: Attachment[];
  created_at: string;
}

interface Ticket {
  id: string;
  ref_id: string;
  category: string;
  subject: string;
  status: string;
  messages: Message[];
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

export default function TicketDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/support/tickets/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const t = data.ticket ?? data;
        setTicket({ ...t, messages: data.messages || [] });
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [reply]);

  const handleReplyFiles = (incoming: FileList) => {
    const arr = Array.from(incoming).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    setReplyFiles((prev) => [...prev, ...arr].slice(0, 5));
  };

  const removeReplyFile = (idx: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("body", reply.trim());
      replyFiles.forEach((f) => fd.append("attachments", f));

      const res = await fetch(`${API_BASE}/support/tickets/${id}/messages`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send reply");
      }
      setReply("");
      setReplyFiles([]);
      await fetchTicket();
    } catch (e: any) {
      setError(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-fill-faint rounded w-1/4" />
          <div className="h-4 bg-fill-faint rounded w-1/2" />
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface-1 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-text-dim">Ticket not found.</p>
        <Link href="/dashboard/support" className="text-accent text-sm mt-2 inline-block hover:underline">Back to Support</Link>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";
  const messages = ticket.messages || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Back link */}
      <Link href="/dashboard/support" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-white transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Support
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-accent font-mono text-xs">{ticket.ref_id}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.closed}`}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS.other}`}>
            {CATEGORY_LABELS[ticket.category] ?? "Other"}
          </span>
        </div>
        <h1 className="text-lg font-bold text-white">{ticket.subject}</h1>
      </div>

      {/* Closed banner */}
      {isClosed && (
        <div className="bg-surface-1 border border-border-default rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-text-phantom shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-text-muted">
            This ticket is closed.{" "}
            <Link href="/dashboard/support/new" className="text-accent hover:underline">Open a new ticket</Link> if you need further assistance.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4 mb-6">
        <AnimatePresence>
          {messages.map((msg) => {
            const isUser = msg.sender_type === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] ${
                    isUser
                      ? "bg-accent/20 border border-accent/30 rounded-2xl rounded-br-md"
                      : "bg-surface-2 border border-border-default rounded-2xl rounded-bl-md"
                  } p-4`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-white">{msg.sender_name}</span>
                    <span className="text-[11px] text-text-phantom">{relativeTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{msg.body}</p>

                  {/* Attachments */}
                  {msg.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.attachments.map((att, i) => {
                        const isImage = att.mime_type?.startsWith("image/");
                        if (isImage) {
                          return (
                            <img
                              key={att.id ?? i}
                              src={att.url}
                              alt={att.filename}
                              onClick={() => setImageViewer(att.url)}
                              className="mx-auto max-w-[280px] max-h-[280px] rounded-lg border border-border-default cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          );
                        }
                        return (
                          <a
                            key={att.id ?? i}
                            href={att.url}
                            download={att.filename}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-surface-1 hover:bg-surface-2 transition-colors"
                          >
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-xs text-text-muted max-w-[120px] truncate">{att.filename}</span>
                          </a>
                        );
                      })}
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
      {!isClosed && (
        <div className="bg-surface-1 border border-border-default rounded-xl p-4">
          {error && <p className="text-sm text-error mb-3">{error}</p>}

          <textarea
            ref={textareaRef}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            rows={3}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 resize-none mb-3"
          />

          {/* Attached files preview */}
          {replyFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {replyFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-fill-subtle text-xs text-text-muted">
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <button onClick={() => removeReplyFile(i)} className="text-text-phantom hover:text-white">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative p-2 rounded-lg text-text-muted hover:text-white hover:bg-fill-faint transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                {replyFiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {replyFiles.length}
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleReplyFiles(e.target.files)}
              />
            </div>

            <button
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Image viewer overlay */}
      <AnimatePresence>
        {imageViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setImageViewer(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={imageViewer}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
