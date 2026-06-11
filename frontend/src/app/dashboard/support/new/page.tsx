"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const CATEGORIES = [
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "kyc_issue", label: "KYC Issue" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "crypto_purchase_issue", label: "Crypto Purchase Issue" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "other", label: "Other" },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileItem {
  file: File;
  preview: string;
  type: "image" | "pdf";
}

export default function NewTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback((incoming: FileList) => {
    setError("");
    const arr = Array.from(incoming);
    const remaining = MAX_FILES - files.length;
    if (arr.length > remaining) {
      setError(`You can attach up to ${MAX_FILES} files maximum.`);
      return;
    }
    const valid: FileItem[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) {
        setError(`File "${f.name}" exceeds the 10 MB limit.`);
        return;
      }
      const isImage = f.type.startsWith("image/");
      const isPdf = f.type === "application/pdf";
      if (!isImage && !isPdf) continue;
      const preview = isImage ? URL.createObjectURL(f) : "";
      valid.push({ file: f, preview, type: isImage ? "image" : "pdf" });
    }
    setFiles((prev) => [...prev, ...valid]);
  }, [files.length]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const item = prev[idx];
      if (item.type === "image") URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const canSubmit = category && subject.trim().length > 0 && message.trim().length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("subject", subject.trim());
      fd.append("body", message.trim());
      files.forEach((f) => fd.append("attachments", f.file));

      const res = await fetch(`${API_BASE}/support/tickets`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create ticket");
      }
      const data = await res.json();
      router.push(`/dashboard/support/${data.id || data.ticket?.id}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Back link */}
      <Link href="/dashboard/support" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-white transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Support
      </Link>

      <h1 className="text-xl font-bold text-white mb-8">Open a Support Ticket</h1>

      <div className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 appearance-none"
          >
            <option value="" className="bg-gray-900">Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-gray-900">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-secondary">Subject</label>
            <span className="text-xs text-text-phantom">{subject.length}/200</span>
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 200))}
            maxLength={200}
            placeholder="Brief description of your issue"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Describe your issue in detail (minimum 20 characters)…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Attachments</label>
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/20 transition-colors"
          >
            <svg className="w-8 h-8 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-text-dim">Drag & drop or <span className="text-accent">browse</span></p>
            <p className="text-xs text-text-phantom">Images & PDFs · Max 5 files · 10 MB each</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {/* File previews */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-3 mt-3">
                {files.map((f, i) => (
                  <motion.div
                    key={`${f.file.name}-${i}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    {f.type === "image" ? (
                      <img src={f.preview} alt={f.file.name} className="w-16 h-16 object-cover rounded-lg border border-border-default" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-border-default bg-surface-2">
                        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <p className="text-[10px] text-text-phantom truncate w-16 text-center mt-1">{f.file.name}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full px-6 py-3 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? "Submitting…" : "Submit Ticket"}
          </button>
          <Link
            href="/dashboard/support"
            className="px-6 py-3 rounded-full text-[14px] font-semibold text-text-muted hover:text-white hover:bg-fill-faint transition-all"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
