"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";
import Link from "next/link";
import { useTableFilters } from "@/hooks/useTableFilters";
import TableFilters from "@/components/ui/TableFilters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ── Types ──
type StatusFilter = "all" | "active" | "suspended";
type RoleFilter = "all" | "individual" | "business" | "admin";

interface UserRow {
  id: number;
  email: string;
  role: string;
  status: "active" | "suspended";
  jurisdiction: string;
  created_at: string;
  profile: { first_name: string | null; last_name: string | null; phone: string | null };
  kyc: { status: string; current_step: number };
  wallet_count: number;
  transaction_count: number;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  jurisdiction: string;
  email_verified: boolean;
  suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  kyc_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  tax_id: string | null;
}

interface KYCVerification {
  id: number;
  type: string;
  status: string;
  step: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_id: number | null;
  rejection_reason: string | null;
}

interface KYCDocument {
  id: number;
  doc_type: string;
  doc_label: string | null;
  filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  status: string;
  created_at: string;
}

interface DetailResponse {
  user: UserDetail;
  kyc_verifications: KYCVerification[];
  documents: KYCDocument[];
}

// ── Constants ──
const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
];

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
  { value: "admin", label: "Admin" },
];

const JURISDICTIONS = ["all", "TT", "JM", "BS", "International"];

// ── Helpers ──
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateShort(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function roleBadge(role: string) {
  const m: Record<string, string> = {
    admin: "bg-purple-400/10 text-purple-400 inset-ring inset-ring-purple-400/20",
    business: "bg-blue-400/10 text-blue-400 inset-ring inset-ring-blue-400/20",
    individual: "bg-emerald-400/10 text-emerald-400 inset-ring inset-ring-emerald-400/20",
  };
  return m[role] || m.individual;
}

function statusBadge(status: string) {
  if (!status || status === "pending") return "bg-gray-400/10 text-gray-400 inset-ring inset-ring-gray-400/20";
  if (status === "submitted" || status === "in_review") return "bg-amber-400/10 text-amber-400 inset-ring inset-ring-amber-400/20";
  if (status === "approved") return "bg-emerald-400/10 text-emerald-400 inset-ring inset-ring-emerald-400/20";
  if (status === "rejected" || status === "expired") return "bg-red-400/10 text-red-400 inset-ring inset-ring-red-400/20";
  return "bg-gray-400/10 text-gray-400 inset-ring inset-ring-gray-400/20";
}

function docTypeLabel(type: string): string {
  const m: Record<string, string> = {
    passport: "Passport", national_id: "National ID", drivers_license: "Driver's License",
    id_front: "ID Front", id_back: "ID Back", proof_of_address: "Proof of Address",
    certificate_of_incorporation: "Certificate of Incorporation",
    articles_of_association: "Articles of Association",
    proof_of_business_address: "Proof of Business Address",
    shareholder_register: "Shareholder Register",
    source_of_funds: "Source of Funds",
    director_id: "Director ID",
  };
  return m[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// ── Phase placeholder component ──
function PhasePlaceholder({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <div className="bg-surface-0 border border-border-subtle rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-fill-subtle text-text-dim`}>
          {phase}
        </span>
        <h4 className="text-sm font-medium text-white">{title}</h4>
      </div>
      <p className="text-xs text-text-dim">{description}</p>
    </div>
  );
}

// ── Page ──
export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Client-side date filter (applied on top of server-fetched data)
  const { filteredData, searchTerm: filterSearch, setSearchTerm: setFilterSearch, fromDate, setFromDate, toDate, setToDate, clearFilters, hasActiveFilters } = useTableFilters({
    data: rows,
    searchFields: [], // search is server-side already
    dateField: "created_at",
  });

  // Detail drawer
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Suspend modal
  const [suspendModal, setSuspendModal] = useState<{ id: number; name: string; currentlySuspended: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendError, setSuspendError] = useState("");

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Role change
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), status: statusFilter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (jurisdictionFilter !== "all") params.set("jurisdiction", jurisdictionFilter);

      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        credentials: "include",
      });
      const json = await res.json();
      setRows(json.rows || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, roleFilter, jurisdictionFilter, debouncedSearch]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter, roleFilter, jurisdictionFilter]);

  // ── Open detail drawer ──
  const openDetail = async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        credentials: "include",
      });
      const json = await res.json();
      setDetail(json);
    } catch (err) {
      console.error("Detail fetch error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setSelectedId(null); setDetail(null); };

  const reasonValid = suspendReason.trim().length >= 10;

  // ── Suspend / Unsuspend ──
  const toggleSuspend = async () => {
    if (!suspendModal) return;
    // Client-side: reason required for suspending (min 10 chars)
    if (!suspendModal.currentlySuspended && !reasonValid) {
      setSuspendError("Reason is required (minimum 10 characters)");
      return;
    }
    setSuspendError("");
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${suspendModal.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ suspend: !suspendModal.currentlySuspended, reason: suspendReason || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || "Failed";
        setSuspendError(msg);
        throw new Error(msg);
      }
      setSuspendModal(null);
      setSuspendReason("");
      showToast("success", suspendModal.currentlySuspended ? `${suspendModal.name} has been unsuspended` : `${suspendModal.name} has been suspended`);
      fetchUsers();
      if (selectedId === suspendModal.id) openDetail(suspendModal.id);
    } catch (err) {
      console.error("Suspend error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Role change ──
  const changeRole = async (newRole: string) => {
    if (!detail || detail.user.role === newRole) return;
    if (!confirm(`Change ${detail.user.name}'s role from ${detail.user.role} to ${newRole}?`)) return;
    setRoleChangeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${detail.user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      fetchUsers();
      openDetail(detail.user.id);
    } catch (err) {
      console.error("Role change error:", err);
    } finally {
      setRoleChangeLoading(false);
    }
  };

  if (authLoading || !isAdmin) return (
    <div className="flex h-full items-center justify-center bg-surface-0">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalPages = Math.ceil(total / limit);
  const kyc = detail?.kyc_verifications?.[0];

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Users</h2>
            <p className="text-[13px] text-text-dim mt-0.5">{total} total users</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-phantom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-border-default text-sm text-white placeholder:text-text-phantom outline-none focus:border-border-accent transition-all" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-border-default text-sm text-text-dim outline-none focus:border-border-accent cursor-pointer">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={jurisdictionFilter} onChange={(e) => setJurisdictionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-border-default text-sm text-text-dim outline-none focus:border-border-accent cursor-pointer">
            {JURISDICTIONS.map((j) => <option key={j} value={j}>{j === "all" ? "All Jurisdictions" : j}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1 border border-border-subtle">
            {STATUS_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === tab.key ? "bg-accent-fill text-accent" : "text-text-dim hover:text-text-secondary"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Date Range Filter ── */}
      <div className="px-6 flex items-center gap-3 mb-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="From date"
          className="h-10 w-40 px-3 py-2 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 flex-shrink-0"
          style={{ colorScheme: "dark" }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="To date"
          className="h-10 w-40 px-3 py-2 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 flex-shrink-0"
          style={{ colorScheme: "dark" }}
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 text-sm text-text-muted hover:text-text-primary whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto px-6">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          hasActiveFilters ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-dim text-sm">
              <p>No users match the current filters</p>
              <button onClick={clearFilters} className="mt-2 text-xs text-accent hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-dim text-sm">No users found</div>
          )
        ) : (
          <div className="overflow-x-auto w-full [touch-action:pan-x]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="text-left py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider hidden md:table-cell">KYC</th>
                  <th className="text-left py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider hidden lg:table-cell">Jurisdiction</th>
                  <th className="text-left py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="text-right py-3 px-2 text-[11px] font-medium text-text-phantom uppercase tracking-wider hidden lg:table-cell"></th>
                </tr>
              </thead>
            <tbody>
              {filteredData.map((row) => (
                <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
                  className={`border-b border-border-subtle cursor-pointer transition-colors ${
                    row.status === "suspended"
                      ? "opacity-50 hover:bg-red-400/5"
                      : selectedId === row.id
                        ? "bg-accent-fill/50 hover:bg-accent-fill/60"
                        : "hover:bg-fill-ghost"
                  }`}
                  onClick={() => openDetail(row.id)}>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-fill flex items-center justify-center text-accent text-xs font-bold shrink-0">
                        {(row.profile.first_name || row.email)[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`${row.status === "suspended" ? "text-text-dim" : "text-white"} font-medium truncate`}>
                          {[row.profile.first_name, row.profile.last_name].filter(Boolean).join(" ") || row.email}
                        </p>
                        <p className="text-[12px] text-text-dim truncate">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 hidden md:table-cell"><span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadge(row.role)}`}>{row.role}</span></td>
                  <td className="py-3 px-2 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusBadge(row.kyc.status || 'pending')}`}>{row.kyc.status || "pending"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-text-dim hidden lg:table-cell">{row.jurisdiction}</td>
                  <td className="py-3 px-2">
                    {row.status === "suspended"
                      ? <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-red-400/10 text-red-400 inset-ring inset-ring-red-400/20">Suspended</span>
                      : <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-emerald-400/10 text-emerald-400 inset-ring inset-ring-emerald-400/20">Active</span>}
                  </td>
                  <td className="py-3 px-2 text-text-dim hidden md:table-cell">{fmtDateShort(row.created_at)}</td>
                  <td className="py-3 px-2 text-right hidden lg:table-cell">
                    <span className="text-[12px] text-text-phantom">→</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-border-default">
          <p className="text-xs text-text-dim">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-2.5 py-1 rounded-lg text-xs text-text-dim hover:bg-fill-faint disabled:opacity-30 disabled:cursor-not-allowed transition-all">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-text-phantom text-xs">…</span>}
                  <button onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs transition-all ${page === p ? "bg-accent-fill text-accent font-medium" : "text-text-dim hover:bg-fill-faint"}`}>{p}</button>
                </span>
              ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg text-xs text-text-dim hover:bg-fill-faint disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          DETAIL SIDE DRAWER
         ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[70] backdrop-blur-sm" onClick={closeDetail} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface-1 border-l border-border-default z-[80] overflow-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : detail ? (
                <div className="p-6 space-y-6">
                  {/* ── Header ── */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-accent-fill flex items-center justify-center text-accent text-lg font-bold">
                        {detail.user.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">{detail.user.name}</p>
                        <p className="text-sm text-text-dim">ID #{detail.user.id}</p>
                      </div>
                    </div>
                    <button onClick={closeDetail}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-white hover:bg-fill-faint transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Status badges row */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadge(detail.user.role)}`}>{detail.user.role}</span>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusBadge(kyc?.status || 'pending')}`}>
                      {kyc?.type || "KYC"}: {kyc?.status || "pending"}
                    </span>
                    {detail.user.suspended
                      ? <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-red-400/10 text-red-400 inset-ring inset-ring-red-400/20">Suspended</span>
                      : <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-emerald-400/10 text-emerald-400 inset-ring inset-ring-emerald-400/20">Active</span>}
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-fill-subtle text-text-dim">{detail.user.jurisdiction}</span>
                  </div>

                  {/* ═══ SECTION 1: IDENTITY ═══ */}
                  <section>
                    <h3 className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-3">Identity</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Full Name", detail.user.name],
                        ["Email", detail.user.email],
                        ["Phone", detail.user.phone || "—"],
                        ["Date of Birth", detail.user.date_of_birth ? fmtDate(String(detail.user.date_of_birth)) : "—"],
                        ["Nationality", detail.user.nationality || "—"],
                        ["Tax ID", detail.user.tax_id || "—"],
                        ["Role", detail.user.role],
                        ["Jurisdiction", detail.user.jurisdiction],
                        ["Account Status", detail.user.suspended ? "Suspended" : "Active"],
                        ["Email Verified", detail.user.email_verified ? "Yes" : "No"],
                        ["Created", fmtDate(detail.user.created_at)],
                        ["Last Updated", fmtDate(detail.user.updated_at)],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="bg-surface-2 rounded-lg p-3">
                          <p className="text-[10px] text-text-phantom mb-0.5">{label}</p>
                          <p className="text-[13px] text-white truncate">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                    {detail.user.suspended && (
                      <div className="mt-2 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                        <p className="text-[10px] text-red-400 font-medium uppercase tracking-wider mb-0.5">Suspension Reason</p>
                        <p className="text-[13px] text-red-300">{detail.user.suspended_reason || "No reason provided"}</p>
                        {detail.user.suspended_at && <p className="text-[11px] text-red-400/60 mt-1">Suspended {fmtDate(detail.user.suspended_at)}</p>}
                      </div>
                    )}
                  </section>

                  {/* ═══ SECTION 2: KYC/KYB STATUS ═══ */}
                  <section>
                    <h3 className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-3">KYC / KYB Status</h3>
                    {kyc ? (
                      <div className="space-y-3">
                        <div className="bg-surface-2 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between"><span className="text-xs text-text-dim">Type</span><span className="text-xs text-white">{kyc.type}</span></div>
                          <div className="flex justify-between"><span className="text-xs text-text-dim">Status</span><span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusBadge(kyc.status)}`}>{kyc.status}</span></div>
                          <div className="flex justify-between"><span className="text-xs text-text-dim">Step</span><span className="text-xs text-white">Step {kyc.step} of 4</span></div>
                          {kyc.submitted_at && <div className="flex justify-between"><span className="text-xs text-text-dim">Submitted</span><span className="text-xs text-white">{fmtDate(kyc.submitted_at)}</span></div>}
                          {kyc.reviewed_at && <div className="flex justify-between"><span className="text-xs text-text-dim">Reviewed</span><span className="text-xs text-white">{fmtDate(kyc.reviewed_at)}</span></div>}
                          {kyc.rejection_reason && (
                            <div className="mt-1 pt-2 border-t border-border-subtle">
                              <p className="text-[10px] text-red-400 font-medium">Rejection Reason</p>
                              <p className="text-xs text-red-300 mt-0.5">{kyc.rejection_reason}</p>
                            </div>
                          )}
                        </div>

                        {/* Review KYC Submission — deep-links to queue filtered by user */}
                        <div className="relative group">
                          {kyc && kyc.status && kyc.status !== "pending" ? (
                            <Link
                              href={`/admin/kyc-queue?user_id=${detail.user.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-fill/10 text-accent hover:bg-accent-fill/20 text-[12px] font-medium transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                              </svg>
                              Review KYC Submission
                              {(kyc.status === "approved" || kyc.status === "rejected") && (
                                <span className="ml-1 text-[10px] opacity-60">(view history)</span>
                              )}
                            </Link>
                          ) : (
                            <button disabled
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-fill-subtle/50 text-text-phantom text-[12px] font-medium cursor-not-allowed"
                              title="No KYC submission yet"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                              </svg>
                              Review KYC Submission
                            </button>
                          )}
                        </div>

                        {/* Documents */}
                        {detail.documents.length > 0 && (
                          <div>
                            <p className="text-[11px] text-text-phantom uppercase tracking-wider mb-2">Submitted Documents</p>
                            <div className="space-y-1.5">
                              {detail.documents.map((doc) => {
                                const docIsPDF = (doc.mime_type === 'application/pdf') || (doc.filename || '').toLowerCase().endsWith('.pdf');
                                const docExt = (doc.filename || '').split('.').pop()?.toUpperCase() || '';
                                return (
                                <div key={doc.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative shrink-0">
                                      {docIsPDF ? (
                                        <a href={`/api/admin/kyc/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="block" title="Click to open PDF">
                                          <div className="w-9 h-9 rounded-lg bg-fill-subtle flex items-center justify-center hover:bg-red-500/10 transition-colors">
                                            <svg className="w-4 h-4 text-text-phantom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                          </div>
                                          <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold bg-red-500/80 text-white px-1 py-0.5 rounded leading-none">PDF</span>
                                        </a>
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg bg-fill-subtle flex items-center justify-center">
                                          <svg className="w-4 h-4 text-text-phantom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                          </svg>
                                          {docExt && (
                                            <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold bg-white/10 text-text-dim px-1 py-0.5 rounded leading-none">{docExt}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[12px] text-white truncate">{doc.doc_label || docTypeLabel(doc.doc_type)}</p>
                                      <p className="text-[10px] text-text-phantom">{doc.filename || doc.doc_type} · {fmtSize(doc.file_size)}</p>
                                    </div>
                                  </div>
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium shrink-0 ${statusBadge(doc.status)}`}>{doc.status}</span>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-surface-2 rounded-lg p-4 text-center">
                        <p className="text-sm text-text-dim">No KYC verification record found</p>
                      </div>
                    )}
                  </section>

                  {/* ═══ SECTION 3: ACCOUNT ACTIONS ═══ */}
                  <section>
                    <h3 className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-3">Account Actions</h3>

                    {/* Suspend / Unsuspend */}
                    <button
                      onClick={() => setSuspendModal({ id: detail.user.id, name: detail.user.name, currentlySuspended: detail.user.suspended })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-3 ${
                        detail.user.suspended
                          ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 border border-emerald-400/20"
                          : "bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20"
                      }`}>
                      {detail.user.suspended ? "Unsuspend This User" : "Suspend This User"}
                    </button>

                    {/* Role change */}
                    {detail.user.role !== "admin" && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-dim whitespace-nowrap">Change Role:</span>
                        <div className="flex-1 flex gap-1 bg-surface-2 rounded-lg p-1 border border-border-subtle">
                          {(["individual", "business"] as const).map((r) => (
                            <button key={r} disabled={roleChangeLoading || detail.user.role === r}
                              onClick={() => changeRole(r)}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                                detail.user.role === r
                                  ? "bg-accent-fill text-accent"
                                  : "text-text-dim hover:text-text-secondary disabled:opacity-30"
                              }`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail.user.role === "admin" && (
                      <p className="text-[11px] text-text-phantom italic">Admin role can only be changed via a separate protected action.</p>
                    )}
                  </section>

                  {/* ═══ SECTION 4: PHASE 2 PLACEHOLDERS ═══ */}
                  <section>
                    <h3 className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-3">Financial</h3>
                    <div className="space-y-2">
                      <PhasePlaceholder title="Wallet Balances" description="Fiat and stablecoin balances — will pull from Alt5 integration." phase="Phase 2" />
                      <PhasePlaceholder title="Recent Transactions" description="Deposit, withdrawal, and transfer history — will pull from ledger_entries." phase="Phase 2" />
                    </div>
                  </section>

                  {/* ═══ SECTION 5: PHASE 3 PLACEHOLDER ═══ */}
                  <section>
                    <h3 className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-3">Investments</h3>
                    <PhasePlaceholder title="Active Investments" description="Investment positions, returns, and portfolio summary." phase="Phase 3" />
                  </section>

                  <div className="pb-4" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-text-dim text-sm">Failed to load user details</div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          SUSPEND MODAL
         ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {suspendModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[90]"
              onClick={() => !actionLoading && setSuspendModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-sm bg-surface-2 border border-border-medium rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                {suspendModal.currentlySuspended ? "Unsuspend User" : "Suspend User"}
              </h3>
              <p className="text-[13px] text-text-dim mb-5">
                {suspendModal.currentlySuspended
                  ? `Unsuspend ${suspendModal.name}? They will regain access to the platform.`
                  : `Suspend ${suspendModal.name}? They will be logged out and unable to access the platform.`}
              </p>
              {!suspendModal.currentlySuspended && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-text-dim">Reason <span className="text-red-400">*</span></label>
                    <span className={`text-[11px] ${reasonValid ? "text-emerald-400" : "text-text-phantom"}`}>{suspendReason.trim().length}/10 min</span>
                  </div>
                  <textarea value={suspendReason} onChange={(e) => { setSuspendReason(e.target.value); if (suspendError) setSuspendError(""); }}
                    placeholder="Provide a reason for suspension (minimum 10 characters)…" rows={3}
                    className={`w-full px-3 py-2 rounded-lg bg-surface-0 border text-sm text-white placeholder:text-text-phantom outline-none resize-none transition-all ${
                      suspendError ? "border-red-400/50" : reasonValid ? "border-emerald-400/30" : "border-border-default focus:border-border-accent"
                    }`} />
                  {suspendError && <p className="mt-1 text-[11px] text-red-400">{suspendError}</p>}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setSuspendModal(null)} disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-text-dim hover:bg-fill-faint transition-all disabled:opacity-50">Cancel</button>
                <button onClick={toggleSuspend} disabled={actionLoading || (!suspendModal.currentlySuspended && !reasonValid)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                    suspendModal.currentlySuspended ? "bg-emerald-400 hover:bg-emerald-500" : "bg-red-400 hover:bg-red-500"
                  }`}>
                  {actionLoading ? "Processing…" : suspendModal.currentlySuspended ? "Unsuspend" : "Suspend"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          TOAST
         ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[110] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                : "bg-red-400/10 border-red-400/20 text-red-400"
            }`}>
            {toast.type === "success" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
