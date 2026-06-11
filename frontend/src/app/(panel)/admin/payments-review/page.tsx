"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, authFetch } from "@/lib/auth-store";
import { type PaymentRequest, type AuditEntry, STATUS_CONFIG } from "@/lib/payment-types";
import { useTableFilters } from "@/hooks/useTableFilters";
import TableFilters from "@/components/ui/TableFilters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

// ──────────────────────────────────────────────────────────
// Page Component
// ──────────────────────────────────────────────────────────

export default function PaymentsReviewPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [remittanceAmount, setRemittanceAmount] = useState("");
  const [remittanceCurrency, setRemittanceCurrency] = useState("USD");
  const proofInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  // Client-side search + date filters
  const { filteredData, searchTerm, setSearchTerm, fromDate, setFromDate, toDate, setToDate, clearFilters, hasActiveFilters } = useTableFilters({
    data: requests,
    searchFields: ["refId", "businessName", "businessEmail", "beneficiary.companyName", "status"],
    dateField: "submittedAt",
  });

  const adminName = user?.name || "Admin";

  // ─── Fetch requests from API ───
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const page = 1; // TODO: pagination
      const res = await authFetch(`/payments/admin/all?page=${page}&limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.requests);
    } catch {
      // Empty state
    }
  };

  // Mark as Received
  const markAsReceived = async (reqId: string) => {
    setActionLoading(reqId);
    try {
      const res = await authFetch(`/payments/admin/${reqId}/receive`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      // Re-fetch to get updated audit log
      await fetchRequests();
    } catch {
      // Handle error
    } finally {
      setActionLoading(null);
    }
  };

  // Mark as Paid + Upload Proof
  const markAsPaid = async (reqId: string) => {
    if (!proofFile) return;
    if (!remittanceAmount || parseFloat(remittanceAmount) <= 0) return;

    setActionLoading(reqId);
    try {
      const formData = new FormData();
      formData.append("proof", proofFile);
      formData.append("remittance_amount", remittanceAmount);
      formData.append("remittance_currency", remittanceCurrency);

      const res = await authFetch(`/payments/admin/${reqId}/pay`, {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) throw new Error();
      setProofFile(null);
      setProofPreview(null);
      setRemittanceAmount("");
      setRemittanceCurrency("USD");
      // Re-fetch to get updated state + audit log
      await fetchRequests();
    } catch {
      // Handle error
    } finally {
      setActionLoading(null);
    }
  };

  // Handle proof file selection
  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
    if (proofInputRef.current) proofInputRef.current.value = "";
  };

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-secondary">Payments Review</h1>
        <p className="text-text-muted text-sm mt-1">
          Review and process business payment requests.
        </p>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", count: requests.filter((r) => r.status === "pending").length, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Received", count: requests.filter((r) => r.status === "received").length, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
          { label: "Paid", count: requests.filter((r) => r.status === "paid").length, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Date Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        onClear={clearFilters}
        searchPlaceholder="Search reference, business, beneficiary…"
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table */}
      <div className="border border-border-default rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-fill-subtle/30 text-[10px] font-medium text-text-phantom uppercase tracking-wider">
          <div className="col-span-2 text-center">Reference</div>
          <div className="col-span-2 text-center">Business</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2 text-center">Beneficiary</div>
          <div className="col-span-2 text-center">Submitted</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Rows */}
        {filteredData.length === 0 && hasActiveFilters && (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No payment requests match the current filters</p>
            <button onClick={clearFilters} className="mt-2 text-xs text-accent hover:underline">Clear filters</button>
          </div>
        )}
        <div className="divide-y divide-border-default/30">
          {filteredData.map((req) => {
            const sc = STATUS_CONFIG[req.status];
            return (
              <div key={req.id}>
                {/* Row */}
                <button
                  onClick={() => setExpandedRow(expandedRow === req.id ? null : req.id)}
                  className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-fill-faint/20 transition-colors cursor-pointer"
                >
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-mono text-text-secondary">{req.refId}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="text-[11px] text-text-secondary truncate">{req.businessName}</p>
                    <p className="text-[9px] text-text-phantom truncate">{req.businessEmail}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-semibold text-text-secondary">
                      ${Number(req.amount).toLocaleString()} {req.currency}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[11px] text-text-muted truncate block">{req.beneficiary.companyName}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[11px] text-text-muted">{formatDate(req.submittedAt)}</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedRow === req.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-4 bg-fill-faint/10 space-y-4">
                        {/* ── Fee Breakdown ── */}
                        {req.handlingFeeAmount && parseFloat(req.handlingFeeAmount) > 0 && (
                          <div className="mb-4">
                            <p className="text-[10px] font-medium text-text-phantom uppercase tracking-wider mb-2">Fee Breakdown</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-muted">Amount</span>
                                <span className="text-text-secondary">
                                  ${Number(req.amount).toLocaleString()} {req.currency}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-muted">
                                  Handling Fee ({req.handlingFeePercent}%)
                                </span>
                                <span className="text-amber-400">
                                  ${Number(req.handlingFeeAmount).toLocaleString()} {req.currency}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs border-t border-border-default/20 pt-1.5">
                                <span className="font-medium text-text-secondary">Total</span>
                                <span className="font-medium text-text-secondary">
                                  ${(Number(req.amount) + Number(req.handlingFeeAmount)).toLocaleString()} {req.currency}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Beneficiary Details ── */}
                        <div>
                          <h4 className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                            Beneficiary Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              { label: "Company", value: req.beneficiary.companyName },
                              { label: "Bank", value: req.beneficiary.bankName },
                              { label: "Account", value: req.beneficiary.accountNumber },
                              { label: "Routing", value: req.beneficiary.routingNumber },
                              { label: "Country", value: req.beneficiary.bankCountry },
                              { label: "Reference", value: req.beneficiary.reference },
                            ].map((f) => (
                              <div key={f.label} className="bg-fill-subtle/30 rounded-lg px-3 py-2">
                                <p className="text-[9px] font-medium text-text-phantom uppercase tracking-wider">{f.label}</p>
                                <p className="text-[11px] text-text-secondary mt-0.5 truncate">{f.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Remittance Details ── */}
                        {req.remittanceAmount && (
                          <div>
                            <h4 className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                              Remittance Details
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-fill-subtle/30 rounded-lg px-3 py-2">
                                <p className="text-[9px] font-medium text-text-phantom uppercase tracking-wider">Amount Remitted</p>
                                <p className="text-[11px] text-text-secondary mt-0.5">{req.remittanceCurrency} {Number(req.remittanceAmount).toLocaleString()}</p>
                              </div>
                              <div className="bg-fill-subtle/30 rounded-lg px-3 py-2">
                                <p className="text-[9px] font-medium text-text-phantom uppercase tracking-wider">Remittance Currency</p>
                                <p className="text-[11px] text-text-secondary mt-0.5">{req.remittanceCurrency}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Receipt & Transfer Proof — side by side ── */}
                        <div className="flex flex-col md:flex-row justify-around items-start gap-6">
                          {/* Business Receipt */}
                          <div className="flex flex-col items-center gap-2 flex-1">
                            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                              Business Receipt
                            </h4>
                            {req.receiptPreview ? (
                              <img
                                src={req.receiptPreview!}
                                alt="Business receipt"
                                className="max-h-40 rounded-lg cursor-pointer border border-border-default hover:border-accent/40 transition-colors"
                                onClick={() => setLightboxImg(req.receiptPreview!)}
                              />
                            ) : (
                              <div className="w-full h-40 rounded-lg border border-dashed border-border-default flex items-center justify-center">
                                <p className="text-xs text-text-phantom">No receipt uploaded</p>
                              </div>
                            )}
                          </div>

                          {/* Transfer Proof */}
                          <div className="flex flex-col items-center gap-2 flex-1">
                            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                              Transfer Proof
                            </h4>
                            {req.transferProof ? (
                              <img
                                src={req.transferProof!}
                                alt="Transfer proof"
                                className="max-h-40 rounded-lg cursor-pointer border border-border-default hover:border-accent/40 transition-colors"
                                onClick={() => setLightboxImg(req.transferProof!)}
                              />
                            ) : (
                              <div className="w-full h-40 rounded-lg border border-dashed border-border-default flex items-center justify-center">
                                <p className="text-xs text-text-phantom">Awaiting transfer proof</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Action Buttons ── */}
                        {req.status !== "paid" && (
                          <div className="space-y-4">
                            {req.status === "pending" && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => markAsReceived(req.id)}
                                  disabled={actionLoading === req.id}
                                  className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === req.id ? (
                                    <span className="inline-flex items-center gap-2">
                                      <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                      Processing…
                                    </span>
                                  ) : (
                                    "Mark as Received"
                                  )}
                                </button>
                              </div>
                            )}

                            {req.status === "received" && (
                              <>
                                <input
                                  ref={proofInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleProofSelect}
                                />
                                <div className="bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-xl p-5 space-y-4">
                                  <h4 className="text-base font-semibold text-text-secondary">Mark as Paid — Remittance Details</h4>
                                  <p className="text-sm text-text-muted">Upload proof of the outgoing transfer to the beneficiary. This will be visible to the business user.</p>

                                  {/* Row 1: Amount + Currency */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Amount Remitted *</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={remittanceAmount}
                                        onChange={(e) => setRemittanceAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Remittance Currency *</label>
                                      <select
                                        value={remittanceCurrency}
                                        onChange={(e) => setRemittanceCurrency(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                                      >
                                        <option value="USD">USD</option>
                                        <option value="TTD">TTD</option>
                                        <option value="JMD">JMD</option>
                                        <option value="BSD">BSD</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Row 2: Upload Zone */}
                                  <div>
                                    <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Transfer Proof *</label>
                                    {proofPreview ? (
                                      <div className="relative rounded-lg border border-border-default overflow-hidden">
                                        <img
                                          src={proofPreview}
                                          alt="Proof preview"
                                          className="max-h-40 w-full object-contain bg-fill-subtle/30"
                                        />
                                        <button
                                          onClick={removeProof}
                                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-0/80 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => proofInputRef.current?.click()}
                                        className="w-full border-2 border-dashed border-border-default hover:border-accent/40 rounded-lg py-8 flex flex-col items-center gap-2 text-text-muted hover:text-text-secondary transition-colors"
                                      >
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM10.5 8.25a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
                                        </svg>
                                        <span className="text-sm">Upload transfer proof</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Mark as Paid — full width below card */}
                                <button
                                  onClick={() => markAsPaid(req.id)}
                                  disabled={!proofPreview || !remittanceAmount || parseFloat(remittanceAmount) <= 0 || actionLoading === req.id}
                                  className="w-full py-3 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === req.id ? (
                                    <span className="inline-flex items-center justify-center gap-2">
                                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Processing…
                                    </span>
                                  ) : (
                                    "Mark as Paid"
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* ── Audit Trail ── */}
                        <AuditTimeline auditLog={req.auditLog} onRequestImageClick={setLightboxImg} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg!}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Audit Timeline ─── */
function AuditTimeline({
  auditLog,
  onRequestImageClick,
}: {
  auditLog: AuditEntry[];
  onRequestImageClick?: (src: string) => void;
}) {
  const actionIcons: Record<string, { icon: string; color: string; ring: string }> = {
    submitted: { icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-amber-400", ring: "bg-amber-500/20" },
    marked_received: { icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-blue-400", ring: "bg-blue-500/20" },
    marked_paid: { icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285", color: "text-emerald-400", ring: "bg-emerald-500/20" },
  };

  const actionLabels: Record<string, string> = {
    submitted: "Submitted",
    marked_received: "Marked Received",
    marked_paid: "Payment Completed",
  };

  return (
    <div>
      <p className="text-[10px] font-medium text-text-phantom uppercase tracking-wider mb-3">Audit Trail</p>

      {/* Horizontal timeline (md+), vertical (mobile) */}
      <div className="space-y-0">
        {auditLog.map((entry, i) => {
          const isLast = i === auditLog.length - 1;
          const iconCfg = actionIcons[entry.action] || actionIcons.submitted;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full ${iconCfg.ring} flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 ${iconCfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconCfg.icon} />
                  </svg>
                </div>
                {!isLast && <div className="w-0.5 h-full min-h-[24px] bg-border-default/30" />}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-text-secondary">{actionLabels[entry.action] || entry.action}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${entry.role === "admin" ? "bg-accent-fill/20 text-accent" : "bg-fill-subtle text-text-phantom"}`}>
                    {entry.role === "admin" ? "Admin" : "Business"}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted mt-0.5">by {entry.performedBy}</p>
                <p className="text-[10px] text-text-phantom mt-0.5">
                  {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                {entry.note && <p className="text-[10px] text-text-muted mt-1 italic">{entry.note}</p>}
                {!!entry.proofImageUrl && onRequestImageClick && (
                  <img
                    src={entry.proofImageUrl as string}
                    alt="Transfer proof"
                    className="mt-2 max-h-16 rounded-lg border border-emerald-500/20 cursor-pointer object-contain hover:border-emerald-500/40 transition-colors"
                    onClick={() => onRequestImageClick(entry.proofImageUrl!)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}