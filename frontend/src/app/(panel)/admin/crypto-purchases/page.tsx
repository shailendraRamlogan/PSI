"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { useTableFilters } from "@/hooks/useTableFilters";
import TableFilters from "@/components/ui/TableFilters";

const cardClasses = "bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-xl p-5";

const NETWORK_BADGES: Record<string, { abbr: string; bg: string; text: string }> = {
  Bitcoin: { abbr: "BTC", bg: "bg-orange-500/20", text: "text-orange-400" },
  Ethereum: { abbr: "ETH", bg: "bg-blue-500/20", text: "text-blue-400" },
  "BNB Chain": { abbr: "BNB", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  Tron: { abbr: "TRX", bg: "bg-red-500/20", text: "text-red-400" },
  Solana: { abbr: "SOL", bg: "bg-purple-500/20", text: "text-purple-400" },
  Polygon: { abbr: "POL", bg: "bg-violet-500/20", text: "text-violet-400" },
  Avalanche: { abbr: "AVAX", bg: "bg-red-600/20", text: "text-red-500" },
  Arbitrum: { abbr: "ARB", bg: "bg-sky-500/20", text: "text-sky-400" },
  Optimism: { abbr: "OP", bg: "bg-rose-500/20", text: "text-rose-400" },
  Base: { abbr: "BASE", bg: "bg-blue-600/20", text: "text-blue-500" },
};

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/20", text: "text-amber-400" },
  succeeded: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  remitted: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  failed: { bg: "bg-red-500/20", text: "text-red-400" },
};

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

interface Purchase {
  id: string;
  refId: string;
  amount: string;
  handlingFeePercent: string;
  handlingFeeAmount: string;
  totalAmount: string;
  network: string;
  walletAddress: string;
  walletLabel: string | null;
  memo: string | null;
  paymentStatus: string;
  stripePaymentStatus: string | null;
  stripePaymentIntentId: string | null;
  transactionHash: string | null;
  remittedAt: string | null;
  remitterName: string | null;
  remittanceStatus: string;
  submittedAt: string;
  userName?: string;
  userEmail?: string;
}

type FilterTab = "all" | "pending" | "remitted";

export default function AdminCryptoPurchasesPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}>
      <AdminCryptoPurchasesInner />
    </Suspense>
  );
}

function AdminCryptoPurchasesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmRemit, setConfirmRemit] = useState<string | null>(null);
  const [remitTxHash, setRemitTxHash] = useState("");
  const [remitLoading, setRemitLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Client-side search + date filters
  const { filteredData, searchTerm, setSearchTerm, fromDate, setFromDate, toDate, setToDate, clearFilters, hasActiveFilters } = useTableFilters({
    data: purchases,
    searchFields: ["refId", "userName", "userEmail", "network", "walletAddress", "paymentStatus", "remittanceStatus"],
    dateField: "submittedAt",
  });

  const activeFilter: FilterTab = searchParams.get("remittance_status") as FilterTab || "all";

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: "25" });
      if (activeFilter !== "all") params.set("remittance_status", activeFilter);
      const res = await authFetch(`/crypto-purchases/admin/all?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPurchases(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const setFilter = (filter: FilterTab) => {
    setPage(1);
    if (filter === "all") {
      router.replace("/admin/crypto-purchases");
    } else {
      router.replace(`/admin/crypto-purchases?remittance_status=${filter}`);
    }
  };

  const handleRemit = async (id: string) => {
    const hash = remitTxHash.trim();
    if (!hash) return;
    try {
      setRemitLoading(id);
      const res = await authFetch(`/crypto-purchases/admin/${id}/remit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_hash: hash }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remit");
      }
      setConfirmRemit(null);
      setRemitTxHash("");
      setExpandedRow(null);
      await fetchPurchases();
    } catch (err) {
      console.error("Failed to remit:", err);
    } finally {
      setRemitLoading(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const truncateAddr = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_BADGES[status] || STATUS_BADGES.pending;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const NetworkBadge = ({ network }: { network: string }) => {
    const config = NETWORK_BADGES[network] || { abbr: network.slice(0, 4).toUpperCase(), bg: "bg-fill-subtle", text: "text-text-muted" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.text}`}>
        {config.abbr}
      </span>
    );
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending Remittance" },
    { key: "remitted", label: "Remitted" },
  ];

  const canRemit = (p: Purchase) => p.paymentStatus === "succeeded" && p.remittanceStatus === "pending";

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-secondary">Crypto Purchase Queue</h1>
        <p className="text-sm text-text-muted mt-1">Review and remit pending crypto purchases</p>
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
        searchPlaceholder="Search reference, user, network…"
        hasActiveFilters={hasActiveFilters}
      />

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-lg w-fit mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeFilter === tab.key
                ? "bg-accent text-black shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className={cardClasses}>
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        hasActiveFilters ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cardClasses + " text-center py-16"}
          >
            <p className="text-text-muted">No crypto purchase requests match the current filters</p>
            <button onClick={clearFilters} className="mt-2 text-xs text-accent hover:underline">Clear filters</button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cardClasses + " text-center py-16"}
          >
            <p className="text-text-muted">No crypto purchase requests found</p>
          </motion.div>
        )
      ) : (
        <div className={cardClasses + " p-0 overflow-hidden"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Reference</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Amount</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Fee</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Network</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Payment</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Remittance</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((p) => (
                  <>
                    <motion.tr
                      key={p.id}
                      onClick={() => toggleRow(p.id)}
                      className="border-b border-border-subtle cursor-pointer hover:bg-fill-ghost/50 transition-colors"
                      initial={false}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-accent">{p.refId}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-text-secondary text-xs">{p.userName || "—"}</span>
                          <span className="text-text-phantom text-[11px]">{p.userEmail || ""}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-text-muted whitespace-nowrap">{formatDate(p.submittedAt)}</td>
                      <td className="px-5 py-3 text-right text-text-secondary">${p.amount}</td>
                      <td className="px-5 py-3 text-right text-text-muted">${p.handlingFeeAmount}</td>
                      <td className="px-5 py-3 text-right font-medium text-text-secondary">${p.totalAmount}</td>
                      <td className="px-5 py-3"><NetworkBadge network={p.network} /></td>
                      <td className="px-5 py-3 font-mono text-xs text-text-muted">{truncateAddr(p.walletAddress)}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.paymentStatus} /></td>
                      <td className="px-5 py-3"><StatusBadge status={p.remittanceStatus} /></td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        {canRemit(p) ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmRemit(p.id); setRemitTxHash(""); setExpandedRow(p.id); }}
                            className="px-2.5 py-1 rounded text-[11px] font-medium bg-accent-fill/30 text-accent hover:bg-accent-fill/50 transition-colors"
                          >
                            Remit ↵
                          </button>
                        ) : (
                          <span className="text-text-phantom text-[11px]">—</span>
                        )}
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedRow === p.id && (
                        <motion.tr
                          key={`expanded-${p.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td colSpan={11}>
                            <div className="px-6 py-5 bg-surface-0/40 border-t border-border-default space-y-5">

                              {/* ROW 1 — 3 equal columns */}
                              <div className="grid grid-cols-3 gap-6">

                                {/* Column 1: WALLET */}
                                <div>
                                  <p className="text-xs tracking-widest text-text-muted mb-2">WALLET</p>
                                  <NetworkBadge network={p.network} />
                                  <div className="flex items-start gap-1.5 mt-1">
                                    <p className="font-mono text-xs text-text-secondary break-all flex-1">{p.walletAddress}</p>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(p.walletAddress)}
                                      className="flex-shrink-0 p-0.5 rounded hover:bg-fill-faint text-text-phantom hover:text-text-secondary transition-colors mt-0.5"
                                      title="Copy address"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                    </button>
                                  </div>
                                  {p.walletLabel && <p className="text-text-muted text-xs mt-1">Label: {p.walletLabel}</p>}
                                  {p.memo && <p className="text-text-muted text-xs mt-0.5">Memo: {p.memo}</p>}
                                </div>

                                {/* Column 2: USER */}
                                <div>
                                  <p className="text-xs tracking-widest text-text-muted mb-2">USER</p>
                                  <p className="text-text-primary font-medium text-sm">{p.userName || "—"}</p>
                                  <p className="text-text-muted text-sm">{p.userEmail || ""}</p>
                                  <p className="text-text-phantom text-xs mt-1">Submitted: {formatDateTime(p.submittedAt)}</p>
                                </div>

                                {/* Column 3: FEE BREAKDOWN */}
                                <div>
                                  <p className="text-xs tracking-widest text-text-muted mb-2">FEE BREAKDOWN</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-text-muted">Amount</span>
                                      <span className="text-text-secondary">${p.amount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-text-muted">Fee ({p.handlingFeePercent}%)</span>
                                      <span className="text-amber-400">${p.handlingFeeAmount}</span>
                                    </div>
                                    <div className="border-t border-border-default/30 my-1" />
                                    <div className="flex justify-between text-sm">
                                      <span className="text-text-secondary">Total</span>
                                      <span className="font-semibold">${p.totalAmount}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="border-t border-border-default/20" />

                              {/* ROW 2 — 3 equal columns */}
                              <div className="grid grid-cols-3 gap-6">

                                {/* Column 1: PAYMENT */}
                                <div>
                                  <p className="text-xs tracking-widest text-text-muted mb-2">PAYMENT</p>
                                  {p.stripePaymentIntentId ? (
                                    <>
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-mono text-xs text-text-secondary" title={p.stripePaymentIntentId}>
                                          {p.stripePaymentIntentId.length > 24 ? p.stripePaymentIntentId.slice(0, 24) + "..." : p.stripePaymentIntentId}
                                        </p>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(p.stripePaymentIntentId!)}
                                          className="flex-shrink-0 p-0.5 rounded hover:bg-fill-faint text-text-phantom hover:text-text-secondary transition-colors"
                                          title="Copy intent ID"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                        </button>
                                      </div>
                                      <div className="mt-1.5">
                                        <StatusBadge status={p.stripePaymentStatus || "pending"} />
                                      </div>
                                      <a
                                        href={`https://dashboard.stripe.com/test/payments/${p.stripePaymentIntentId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-accent mt-2 hover:underline"
                                      >
                                        View in Stripe Dashboard →
                                      </a>
                                    </>
                                  ) : (
                                    <p className="text-text-phantom text-xs">—</p>
                                  )}
                                </div>

                                {/* Column 2: TRANSACTION HASH */}
                                <div>
                                  <p className="text-xs tracking-widest text-text-muted mb-2">TRANSACTION HASH</p>
                                  {p.remittanceStatus === "remitted" && p.transactionHash ? (
                                    <>
                                      <div className="flex items-start gap-1.5">
                                        <p className="font-mono text-xs text-text-secondary break-all flex-1">{p.transactionHash}</p>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(p.transactionHash!)}
                                          className="flex-shrink-0 p-0.5 rounded hover:bg-fill-faint text-text-phantom hover:text-text-secondary transition-colors"
                                          title="Copy hash"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                        </button>
                                      </div>
                                      {/* Explorer link */}
                                      {(() => {
                                        const explorers: Record<string, string> = {
                                          Bitcoin: "https://blockstream.info/tx/",
                                          Ethereum: "https://etherscan.io/tx/",
                                          "BNB Chain": "https://bscscan.com/tx/",
                                          Tron: "https://tronscan.org/#/transaction/",
                                          Solana: "https://solscan.io/tx/",
                                          Polygon: "https://polygonscan.com/tx/",
                                          Avalanche: "https://snowtrace.io/tx/",
                                          Arbitrum: "https://arbiscan.io/tx/",
                                          Optimism: "https://optimistic.etherscan.io/tx/",
                                          Base: "https://basescan.org/tx/",
                                        };
                                        const url = explorers[p.network];
                                        return url ? (
                                          <a href={`${url}${p.transactionHash}`} target="_blank" rel="noopener noreferrer" className="block text-xs text-accent mt-1.5 hover:underline">
                                            View on {p.network} →
                                          </a>
                                        ) : null;
                                      })()}
                                    </>
                                  ) : (
                                    <p className="text-text-phantom text-xs">—</p>
                                  )}
                                </div>

                                {/* Column 3: REMITTANCE ACTION */}
                                <div>
                                  <p className="text-xs tracking-widest text-text-muted mb-2">REMITTANCE ACTION</p>
                                  {canRemit(p) ? (
                                    <>
                                      <input
                                        type="text"
                                        value={remitTxHash}
                                        onChange={(e) => setRemitTxHash(e.target.value)}
                                        placeholder="Enter blockchain transaction hash..."
                                        className="w-full px-2.5 py-1.5 bg-fill-subtle/50 border border-border-default rounded text-xs font-mono text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50"
                                      />
                                      <button
                                        onClick={() => handleRemit(p.id)}
                                        disabled={remitLoading === p.id || !remitTxHash.trim()}
                                        className="w-full mt-2 px-3 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
                                      >
                                        {remitLoading === p.id ? "Processing..." : "Confirm Remittance"}
                                      </button>
                                    </>
                                  ) : p.remittanceStatus === "remitted" ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">
                                        ✓ Remitted
                                      </span>
                                      {p.remittedAt && <p className="text-text-muted text-xs mt-1.5">{formatDateTime(p.remittedAt)}</p>}
                                      {p.remitterName && <p className="text-text-muted text-xs">by {p.remitterName}</p>}
                                    </>
                                  ) : (
                                    <p className="text-text-phantom text-xs">—</p>
                                  )}
                                </div>
                              </div>

                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border-default">
              <p className="text-xs text-text-phantom">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded text-xs text-text-muted hover:text-text-secondary hover:bg-fill-faint disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded text-xs text-text-muted hover:text-text-secondary hover:bg-fill-faint disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
