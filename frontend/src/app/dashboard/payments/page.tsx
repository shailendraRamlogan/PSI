"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, authFetch } from "@/lib/auth-store";
import { type PaymentStatus, type PaymentRequest, type AuditEntry, type PaymentNotification, STATUS_CONFIG } from "@/lib/payment-types";
import { usePlatformFee } from "@/hooks/usePlatformFee";
import FeeDisclosure from "@/components/ui/FeeDisclosure";
import Select from "@/components/ui/Select";
import { useTableFilters } from "@/hooks/useTableFilters";
import TableFilters from "@/components/ui/TableFilters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const inputClasses =
  "w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors";

const labelClasses = "block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider";

const sectionHeaderClasses = "text-base font-semibold text-text-secondary mb-4";

const cardClasses = "bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-xl p-5";

export default function PaymentsPage() {
  console.log("[PaymentsPage] render");
  const { user } = useAuth();
  console.log("[PaymentsPage] user:", user?.role, user?.email);

  // Tab state
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [dismissedNotifId, setDismissedNotifId] = useState<string | null>(null);

  // Payment requests storage
  const [requests, setRequests] = useState<PaymentRequest[]>([]);

  // Client-side search + date filters
  const { filteredData, searchTerm, setSearchTerm, fromDate, setFromDate, toDate, setToDate, clearFilters, hasActiveFilters } = useTableFilters({
    data: requests,
    searchFields: ["refId", "beneficiary.companyName", "status"],
    dateField: "submittedAt",
  });

  // Form state
  const { fee: platformFee } = usePlatformFee();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("TTD");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [beneficiary, setBeneficiary] = useState({
    companyName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    bankCountry: "",
    reference: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch requests from API ───
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && activeTab === "list") {
      fetchRequests();
    }
  }, [activeTab, mounted]);

  const fetchRequests = async () => {
    try {
      const res = await authFetch("/payments");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data);
    } catch {
      // If fetch fails, keep existing state (no backend = mock-like behavior)
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setReceiptFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!beneficiary.companyName || !beneficiary.bankName || !beneficiary.accountNumber) {
      setError("Please fill in required beneficiary fields");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("currency", currency);
      formData.append("beneficiary_company_name", beneficiary.companyName);
      formData.append("beneficiary_bank_name", beneficiary.bankName);
      formData.append("beneficiary_account_number", beneficiary.accountNumber);
      if (beneficiary.routingNumber) formData.append("beneficiary_routing_number", beneficiary.routingNumber);
      if (beneficiary.bankCountry) formData.append("beneficiary_bank_country", beneficiary.bankCountry);
      if (beneficiary.reference) formData.append("beneficiary_reference", beneficiary.reference);
      if (receiptFile) formData.append("receipt", receiptFile);

      const res = await authFetch("/payments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit");
      }

      const data = await res.json();
      // Add to local state immediately
      setRequests((prev) => [data, ...prev]);
      setSuccess(data.refId);
      setActiveTab("list");
      // Clear form
      setAmount("");
      setCurrency("TTD");
      setReceiptFile(null);
      setReceiptPreview(null);
      setBeneficiary({
        companyName: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        bankCountry: "",
        reference: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };

  // Role guard
  if (user && user.role !== "business" && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <h2 className="text-lg font-semibold text-text-secondary">Access Restricted</h2>
          <p className="text-sm text-text-faint mt-1">
            Business payments are available for business accounts.
          </p>
        </motion.div>
      </div>
    );
  }

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!mounted) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Lightbox overlay */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightboxImg(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImg!}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-text-secondary">Payments</h1>
        <p className="text-text-muted text-sm mt-1">
          Manage payment requests and track status.
        </p>
      </div>

      {/* Notification banners */}
      {notifications.filter(n => !n.read).map((notif) => (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mb-4 rounded-xl p-4 flex items-start gap-3 border ${
            notif.type === "received"
              ? "bg-blue-500/5 border-blue-500/20"
              : "bg-emerald-500/5 border-emerald-500/20"
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            notif.type === "received" ? "bg-blue-500/15" : "bg-emerald-500/15"
          }`}>
            <svg className={`w-4 h-4 ${notif.type === "received" ? "text-blue-400" : "text-emerald-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={notif.type === "received" ? "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285"} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${notif.type === "received" ? "text-blue-400" : "text-emerald-400"}`}>
              {notif.type === "received"
                ? `Your payment of $${Number(notif.amount).toLocaleString()} ${notif.currency} has been received by PSI.`
                : `PSI has completed your payment to ${notif.beneficiaryName}.`}
            </p>
            <p className="text-xs text-text-phantom mt-0.5">Reference: {notif.refId}</p>
            {notif.type === "paid" && (
              <button className="mt-2 text-xs text-accent hover:underline" onClick={() => setExpandedRow(notif.requestId)}>
                View transfer proof
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
            }}
            className="text-text-phantom hover:text-text-muted flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      ))}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-fill-subtle/50 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "list"
              ? "bg-accent text-white"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Payment History
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "form"
              ? "bg-accent text-white"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          New Request
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search + Date Filters */}
            <TableFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              fromDate={fromDate}
              onFromDateChange={setFromDate}
              toDate={toDate}
              onToDateChange={setToDate}
              onClear={clearFilters}
              searchPlaceholder="Search reference, beneficiary…"
              hasActiveFilters={hasActiveFilters}
            />

            {/* Empty state */}
            {filteredData.length === 0 ? (
              hasActiveFilters ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-text-muted text-sm">No payment requests match the current filters</p>
                  <button onClick={clearFilters} className="mt-2 text-xs text-accent hover:underline">Clear filters</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-fill-subtle flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-text-phantom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-text-muted text-sm font-medium">No payment requests yet</p>
                  <p className="text-text-phantom text-xs mt-1">Your submitted requests will appear here.</p>
                  <button
                    onClick={() => setActiveTab("form")}
                    className="mt-5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent/90 transition-colors"
                  >
                    Create First Request
                  </button>
                </div>
              )
            ) : (
              /* Request list */
              <div className="max-w-4xl mx-auto">
                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-medium text-text-phantom uppercase tracking-wider">
                  <div className="col-span-3">Reference</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-3">Beneficiary</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>

                {/* Rows */}
                <div className="space-y-0.5">
                  {filteredData.map((req) => {
                    const isExpanded = expandedRow === req.id;
                    const sc = STATUS_CONFIG[req.status];

                    return (
                      <div key={req.id} className="border border-border-default/50 rounded-lg overflow-hidden">
                        {/* Row */}
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                          className="w-full grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-fill-faint/30 transition-colors cursor-pointer"
                        >
                          <div className="col-span-3">
                            <span className="text-xs font-mono text-text-secondary">{req.refId}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] text-text-muted">{formatDate(req.submittedAt)}</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-xs font-semibold text-text-secondary">
                              ${Number(req.amount).toLocaleString()} {req.currency}
                            </span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-[11px] text-text-muted truncate block">
                              {req.beneficiary.companyName}
                            </span>
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
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-4 border-t border-border-default/30 space-y-4 bg-fill-faint/20">
                                {/* Fee Breakdown */}
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

                                {/* Beneficiary details */}
                                <div>
                                  <p className="text-[10px] font-medium text-text-phantom uppercase tracking-wider mb-2">Beneficiary Details</p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <DetailField label="Company" value={req.beneficiary.companyName} />
                                    <DetailField label="Bank" value={req.beneficiary.bankName} />
                                    <DetailField label="Account" value={req.beneficiary.accountNumber} />
                                    {req.beneficiary.routingNumber && (
                                      <DetailField label="Routing" value={req.beneficiary.routingNumber} />
                                    )}
                                    {req.beneficiary.bankCountry && (
                                      <DetailField label="Country" value={req.beneficiary.bankCountry} />
                                    )}
                                    {req.beneficiary.reference && (
                                      <DetailField label="Reference" value={req.beneficiary.reference} />
                                    )}
                                  </div>
                                </div>

                                {/* Receipt & Transfer Proof — side by side */}
                                <div className="flex flex-col md:flex-row justify-around items-start gap-6">
                                  {/* Bank Transfer Receipt */}
                                  <div className="flex flex-col items-center gap-2 flex-1">
                                    <p className="text-[10px] font-medium text-text-phantom uppercase tracking-wider">Bank Transfer Receipt</p>
                                    {req.receiptPreview ? (
                                      <img
                                        src={req.receiptPreview!}
                                        alt="Receipt"
                                        className="max-h-32 rounded-lg border border-border-default cursor-pointer object-contain hover:border-accent/30 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImg(req.receiptPreview!);
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-32 rounded-lg border border-dashed border-border-default flex items-center justify-center">
                                        <p className="text-xs text-text-phantom">No receipt uploaded</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Transfer Proof */}
                                  <div className="flex flex-col items-center gap-2 flex-1">
                                    <p className="text-[10px] font-medium text-text-phantom uppercase tracking-wider">Transfer Proof</p>
                                    {req.transferProof ? (
                                      <img
                                        src={req.transferProof!}
                                        alt="Transfer proof"
                                        className="max-h-32 rounded-lg border border-emerald-500/20 cursor-pointer object-contain hover:border-emerald-500/40 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImg(req.transferProof!);
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-32 rounded-lg border border-dashed border-border-default flex items-center justify-center">
                                        <p className="text-xs text-text-phantom">Awaiting transfer proof</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Remittance Details */}
                                {req.remittanceAmount && (
                                  <div className="mt-4">
                                    <p className="text-[10px] font-medium text-text-phantom uppercase tracking-wider mb-2">Remittance Details</p>
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

                                {/* Audit Trail */}
                                <AuditTimeline
                                  auditLog={req.auditLog}
                                  onRequestImageClick={(src) => setLightboxImg(src)}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence>
              {success ? (
                <motion.div
                  key={success}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-md mx-auto mt-12"
                >
                  <div className="bg-surface-1/60 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-text-secondary">Payment Request Submitted</h3>
                    <p className="text-sm text-text-muted mt-1">
                      Your payment request has been submitted and is pending review.
                    </p>
                    <div className="mt-4 px-4 py-2 bg-fill-subtle rounded-lg inline-block">
                      <p className="text-xs text-text-muted">Reference ID</p>
                      <p className="text-base font-mono font-semibold text-accent">{success}</p>
                    </div>
                    <button
                      onClick={() => { setSuccess(null); setActiveTab("list"); }}
                      className="mt-6 w-full py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-secondary border border-border-default hover:border-text-muted/30 transition-colors"
                    >
                      View in History
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="max-w-2xl mx-auto space-y-5"
                >
                  {/* Error display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Section 1: Payment Details */}
                  <div className={cardClasses}>
                    <h2 className={sectionHeaderClasses}>Payment Details</h2>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className={labelClasses}>Amount</label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className={`${inputClasses} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        <FeeDisclosure fee={platformFee} />
                      </div>
                      <div className="w-32">
                        <label className={labelClasses}>Currency</label>
                        <Select
                          options={[
                            { value: "TTD", label: "TTD" },
                            { value: "JMD", label: "JMD" },
                            { value: "BSD", label: "BSD" },
                          ]}
                          value={currency}
                          onChange={setCurrency}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Bank Transfer Receipt */}
                  <div className={cardClasses}>
                    <h2 className={sectionHeaderClasses}>Bank Transfer Receipt</h2>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptChange}
                      className="hidden"
                    />

                    {receiptPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={receiptPreview!}
                          alt="Receipt preview"
                          className="max-h-40 rounded-lg border border-border-default object-contain"
                        />
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                          title="Remove receipt"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border-default hover:border-accent/40 rounded-lg py-8 flex flex-col items-center gap-2 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM10.5 8.25a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
                        </svg>
                        <span className="text-sm">Upload receipt image</span>
                      </button>
                    )}
                  </div>

                  {/* Section 3: Pay On My Behalf — Beneficiary */}
                  <div className={cardClasses}>
                    <h2 className={sectionHeaderClasses}>Pay On My Behalf — Beneficiary</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Company Name *</label>
                        <input
                          type="text"
                          value={beneficiary.companyName}
                          onChange={(e) => setBeneficiary({ ...beneficiary, companyName: e.target.value })}
                          placeholder="Beneficiary company"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Bank Name *</label>
                        <input
                          type="text"
                          value={beneficiary.bankName}
                          onChange={(e) => setBeneficiary({ ...beneficiary, bankName: e.target.value })}
                          placeholder="Bank name"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Account Number *</label>
                        <input
                          type="text"
                          value={beneficiary.accountNumber}
                          onChange={(e) => setBeneficiary({ ...beneficiary, accountNumber: e.target.value })}
                          placeholder="Account number"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Routing / Transit Number</label>
                        <input
                          type="text"
                          value={beneficiary.routingNumber}
                          onChange={(e) => setBeneficiary({ ...beneficiary, routingNumber: e.target.value })}
                          placeholder="Routing number"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Bank Country</label>
                        <input
                          type="text"
                          value={beneficiary.bankCountry}
                          onChange={(e) => setBeneficiary({ ...beneficiary, bankCountry: e.target.value })}
                          placeholder="e.g. Trinidad & Tobago"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelClasses}>
                        Reference / Note <span className="normal-case tracking-normal text-text-faint">(Optional)</span>
                      </label>
                      <textarea
                        value={beneficiary.reference}
                        onChange={(e) => setBeneficiary({ ...beneficiary, reference: e.target.value })}
                        placeholder="Any additional details..."
                        rows={3}
                        className={`${inputClasses} resize-none`}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      "Submit Payment Request"
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Detail Field ─── */
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-text-phantom">{label}</p>
      <p className="text-xs text-text-secondary mt-0.5">{value}</p>
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
