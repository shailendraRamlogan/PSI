"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type Status = "pending" | "submitted" | "approved" | "rejected";
type FilterTab = "all" | "pending" | "submitted" | "approved" | "rejected";

interface QueueRow {
  id: number;
  name: string;
  email: string;
  type: "KYC" | "KYB";
  jurisdiction: string;
  status: Status;
  submittedAt: string | null;
  kycData: Record<string, unknown>;
}

interface DetailData extends QueueRow {
  rejectionReason?: string | null;
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function KYCQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user_id");
  const [userIdFilter, setUserIdFilter] = useState<string | null>(initialUserId);

  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const userIdParam = userIdFilter ? `&user_id=${userIdFilter}` : "";
      const res = await fetch(`${API_BASE}/admin/kyc/queue?page=1&limit=50${statusParam}${userIdParam}`, {
        credentials: "include",
      });
      const json = await res.json();
      setRows(json.rows || []);
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, userIdFilter]);

  useEffect(() => { if (isAdmin) fetchQueue(); }, [isAdmin, fetchQueue]);

  const openDetail = async (id: number) => {
    setSelectedId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/${id}`, {
        credentials: "include",
      });
      const json = await res.json();
      setDetail(json);
    } catch (err) {
      console.error("Detail fetch error:", err);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "approved" }),
      });
      setDetail(null);
      setSelectedId(null);
      fetchQueue();
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/kyc/${rejectModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "rejected", reason: rejectReason.trim() }),
      });
      setRejectModal(null);
      setRejectReason("");
      setDetail(null);
      setSelectedId(null);
      fetchQueue();
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const exportZip = async (id: number, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/${id}/export`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kyc-${name.replace(/\s+/g, "-")}-${id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Redirect non-admins out
  useEffect(() => {
    if (user && user.role !== "admin") {
      window.location.href = "/dashboard";
    }
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return (
    <div className="flex h-full items-center justify-center bg-surface-0">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusBadge = (status: Status) => {
    const colors: Record<Status, string> = {
      pending: "bg-gray-400/10 text-gray-400 inset-ring inset-ring-gray-400/20",
      submitted: "bg-blue-400/10 text-blue-400 inset-ring inset-ring-blue-400/20",
      approved: "bg-emerald-400/10 text-emerald-400 inset-ring inset-ring-emerald-400/20",
      rejected: "bg-red-400/10 text-red-400 inset-ring inset-ring-red-400/20",
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Page title + refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">KYC / KYB Queue</h1>
          <p className="text-[12px] text-text-faint mt-0.5">Review and manage identity verification submissions</p>
        </div>
        <button onClick={fetchQueue} className="text-[12px] text-accent hover:underline flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent-fill-ghost transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              filter === tab.key
                ? "bg-accent-fill text-accent border border-border-accent"
                : "text-text-faint hover:text-text-muted hover:bg-fill-ghost"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-text-phantom text-sm">Loading queue…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-text-phantom text-sm">No submissions found</div>
      ) : (
        <div className="border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-fill-ghost border-b border-border-default">
                <th className="text-left px-4 py-3 text-[11px] text-text-faint uppercase tracking-wider font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[11px] text-text-faint uppercase tracking-wider font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[11px] text-text-faint uppercase tracking-wider font-medium">Submitted</th>
                <th className="text-left px-4 py-3 text-[11px] text-text-faint uppercase tracking-wider font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[11px] text-text-faint uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => openDetail(row.id)}
                  className={`border-b border-border-subtle cursor-pointer transition-colors ${
                    selectedId === row.id ? "bg-accent-fill-ghost" : "hover:bg-fill-ghost"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[14px] font-medium">{row.name}</p>
                      <p className="text-[11px] text-text-ghost">{row.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      row.type === "KYB" ? "bg-purple-400/10 text-purple-400 inset-ring inset-ring-purple-400/20" : "bg-blue-400/10 text-blue-400 inset-ring inset-ring-blue-400/20"
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-dim">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => exportZip(row.id, row.name)}
                      className="text-[11px] text-text-ghost hover:text-accent transition-colors"
                      title="Export ZIP"
                    >
                      <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Side Panel ─── */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setDetail(null); setSelectedId(null); }}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-surface-2 border-l border-border-medium z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">{detail.name}</h2>
                    <p className="text-[12px] text-text-faint">{detail.email} • {detail.type}</p>
                  </div>
                  <button onClick={() => { setDetail(null); setSelectedId(null); }} className="text-text-phantom hover:text-text-secondary transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 flex items-center gap-3">
                  {statusBadge(detail.status)}
                  {detail.submittedAt && (
                    <span className="text-[11px] text-text-phantom">
                      Submitted {new Date(detail.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {detail.rejectionReason && (
                  <div className="mb-6 bg-error-fill border border-red-500/20 rounded-xl p-4">
                    <p className="text-[11px] text-red-300/50 uppercase tracking-wide mb-1">Rejection Reason</p>
                    <p className="text-[13px] text-red-300/80">{detail.rejectionReason}</p>
                  </div>
                )}

                <DetailSections detail={detail} onImageClick={(src) => setLightboxSrc(src)} />

                {(detail.status === "submitted" || detail.status === "pending") && (
                  <div className="mt-8 flex gap-3 sticky bottom-0 bg-surface-2 pt-4 pb-2 border-t border-border-default">
                    <motion.button
                      onClick={() => handleApprove(detail.id)}
                      disabled={actionLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-full text-[14px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Processing…" : "Approve"}
                    </motion.button>
                    <motion.button
                      onClick={() => setRejectModal({ id: detail.id, name: detail.name })}
                      disabled={actionLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-full text-[14px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxSrc(null)}
            className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-8 cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxSrc}
              alt="Document preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute top-6 right-6 text-text-dim hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Reject Modal ─── */}
      <AnimatePresence>
        {rejectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setRejectModal(null); setRejectReason(""); }}
              className="fixed inset-0 bg-black/60 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md bg-surface-2 border border-border-strong rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-1">Reject Verification</h3>
              <p className="text-[13px] text-text-dim mb-4">
                Provide a reason for rejecting <strong className="text-text-muted">{rejectModal.name}</strong>&apos;s submission.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Document is unreadable, please upload a clearer scan…"
                rows={4}
                className="w-full bg-fill-faint border border-border-strong rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-text-ghost focus:outline-none focus:border-border-accent-focus resize-none"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  className="flex-1 px-4 py-2.5 rounded-full text-[13px] text-text-muted bg-fill-faint border border-border-medium hover:bg-fill-subtle transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-full text-[13px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-30"
                >
                  {actionLoading ? "Rejecting…" : "Confirm Rejection"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Detail Sections ─── */
function DetailSections({ detail, onImageClick }: { detail: DetailData; onImageClick: (src: string) => void }) {
  const data = detail.kycData || {};
  const pi = (data.personalInfo || {}) as Record<string, string>;
  const addr = (data.addressDocs || {}) as Record<string, unknown>;
  const idDocs = (data.identityDocs || {}) as Record<string, unknown>;
  const bi = (data.businessInfo || {}) as Record<string, string>;
  const docs = (data.documents || {}) as Record<string, unknown>;
  const directors = (data.directors || []) as Record<string, unknown>[];

  return (
    <div className="space-y-5">
      {detail.type === "KYB" ? (
        <Section title="Business Information">
          <R l="Legal name" v={bi.legalBusinessName} />
          <R l="Trading name" v={bi.tradingName} />
          <R l="Reg. #" v={bi.registrationNumber} />
          <R l="Incorporation" v={bi.incorporationDate} />
          <R l="Type" v={bi.businessType} />
          <R l="Jurisdiction" v={bi.jurisdiction} />
          <R l="Address" v={bi.businessAddress} />
          <R l="Website" v={bi.website} />
          <R l="Industry" v={bi.industry} />
        </Section>
      ) : (
        <Section title="Personal Information">
          <R l="Name" v={`${pi.firstName || ""} ${pi.lastName || ""}`} />
          <R l="DOB" v={pi.dateOfBirth} />
          <R l="Nationality" v={pi.nationality} />
          <R l="Tax ID" v={pi.taxId} />
          <R l="Phone" v={pi.phoneNumber} />
        </Section>
      )}

      <Section title="Identity Documents">
        <R l="ID type" v={idDocs.idType === "passport" ? "Passport" : idDocs.idType === "national_id" ? "National ID" : idDocs.idType === "drivers_license" ? "Driver License" : (idDocs.idType as string)} />
        {idDocs.idType === "passport" ? (
          <FilePreview file={idDocs.passport as Record<string, string> | null} label="Passport Page" onImageClick={onImageClick} />
        ) : (
          <>
            <FilePreview file={idDocs.front as Record<string, string> | null} label="Front" onImageClick={onImageClick} />
            <FilePreview file={idDocs.back as Record<string, string> | null} label="Back" onImageClick={onImageClick} />
          </>
        )}
      </Section>

      {detail.type === "KYC" && (
        <Section title="Address">
          <R l="Street" v={addr.streetAddress as string} />
          <R l="City" v={addr.city as string} />
          <R l="State" v={addr.stateProvince as string} />
          <R l="Postal" v={addr.postalCode as string} />
          <R l="Country" v={addr.country as string} />
          <FilePreview file={addr.proofFile as Record<string, string> | null} label="Proof" onImageClick={onImageClick} />
        </Section>
      )}

      {detail.type === "KYB" && directors.length > 0 && (
        <Section title={`Directors (${directors.length})`}>
          {directors.map((d, i) => (
            <div key={i} className="bg-fill-ghost rounded-lg p-3 mt-2">
              <R l="Name" v={(d.fullName as string) || ""} />
              <R l="Role" v={(d.role as string) || ""} />
              <R l="Nationality" v={(d.nationality as string) || ""} />
              <R l="Ownership" v={d.ownershipPercent ? `${d.ownershipPercent}%` : ""} />
              {d.idFile ? <FilePreview file={d.idFile as Record<string, string>} label="ID" onImageClick={onImageClick} /> : null}
            </div>
          ))}
        </Section>
      )}

      {detail.type === "KYB" && (
        <Section title="Business Documents">
          <FilePreview file={docs.certificateOfIncorporation as Record<string, string> | null} label="Certificate of Incorporation" onImageClick={onImageClick} />
          <FilePreview file={docs.articlesOfAssociation as Record<string, string> | null} label="Articles of Association" onImageClick={onImageClick} />
          <FilePreview file={docs.proofOfBusinessAddress as Record<string, string> | null} label="Proof of Address" onImageClick={onImageClick} />
          <FilePreview file={docs.shareholderRegister as Record<string, string> | null} label="Shareholder Register" onImageClick={onImageClick} />
          <FilePreview file={docs.sourceOfFundsDeclaration as Record<string, string> | null} label="Source of Funds" onImageClick={onImageClick} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-text-dim uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-fill-ghost border border-border-default rounded-xl p-3 space-y-1">{children}</div>
    </div>
  );
}

function R({ l, v }: { l: string; v: string | undefined | null }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-[12px] text-text-faint">{l}</span>
      <span className="text-[12px] text-text-secondary">{v || "—"}</span>
    </div>
  );
}

function FilePreview({ file, label, onImageClick }: { file: Record<string, string> | null; label: string; onImageClick: (src: string) => void }) {
  if (!file) return <R l={label} v="Not uploaded" />;
  const isImage = file.preview && file.type !== "application/pdf";
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[12px] text-text-faint">{label}</span>
      <div className="flex-1" />
      {isImage ? (
        <img
          src={file.preview}
          alt={label}
          onClick={() => onImageClick(file.preview)}
          className="w-10 h-10 rounded-lg object-cover border border-border-strong cursor-pointer hover:border-border-accent-hover hover:scale-105 transition-all"
          title="Click to enlarge"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-fill-subtle flex items-center justify-center">
          <svg className="w-4 h-4 text-text-phantom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
      )}
      <span className="text-[11px] text-text-dim max-w-[120px] truncate">{file.name}</span>
    </div>
  );
}
