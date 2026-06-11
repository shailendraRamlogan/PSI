"use client";

import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-store";
import Link from "next/link";
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

const EXPLORER_URLS: Record<string, { url: string; name: string }> = {
  Bitcoin: { url: "https://blockstream.info/tx/{hash}", name: "Blockstream" },
  Ethereum: { url: "https://etherscan.io/tx/{hash}", name: "Etherscan" },
  "BNB Chain": { url: "https://bscscan.com/tx/{hash}", name: "BscScan" },
  Tron: { url: "https://tronscan.org/#/transaction/{hash}", name: "Tronscan" },
  Solana: { url: "https://solscan.io/tx/{hash}", name: "Solscan" },
  Polygon: { url: "https://polygonscan.com/tx/{hash}", name: "PolygonScan" },
  Avalanche: { url: "https://snowtrace.io/tx/{hash}", name: "SnowTrace" },
  Arbitrum: { url: "https://arbiscan.io/tx/{hash}", name: "Arbiscan" },
  Optimism: { url: "https://optimistic.etherscan.io/tx/{hash}", name: "Optimistic Etherscan" },
  Base: { url: "https://basescan.org/tx/{hash}", name: "BaseScan" },
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

function getExplorerUrl(network: string, hash: string) {
  const explorer = EXPLORER_URLS[network];
  if (!explorer) return null;
  return explorer.url.replace("{hash}", hash);
}

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
  remittanceStatus: string;
  transactionHash: string | null;
  submittedAt: string;
}

export default function CryptoPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Client-side search + date filters
  const { filteredData, searchTerm, setSearchTerm, fromDate, setFromDate, toDate, setToDate, clearFilters, hasActiveFilters } = useTableFilters({
    data: purchases,
    searchFields: ["refId", "network", "walletAddress", "paymentStatus", "remittanceStatus"],
    dateField: "submittedAt",
  });

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await authFetch("/crypto-purchases");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-secondary">Crypto Purchases</h1>
        <p className="text-sm text-text-muted mt-1">Track your cryptocurrency purchase requests</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className={cardClasses}>
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        </div>
      ) : purchases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cardClasses + " text-center py-16"}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-fill-subtle/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-phantom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9v1m0 4v1m-6-6v1m0 4v1" />
            </svg>
          </div>
          <p className="text-text-muted mb-1">No purchase requests yet</p>
          <p className="text-sm text-text-phantom mb-6">Start by submitting your first crypto purchase</p>
          <Link
            href="/dashboard/crypto-purchase"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-black text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Buy Crypto
          </Link>
        </motion.div>
      ) : (
        <>
        {/* Search + Date Filters */}
        <TableFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
          onClear={clearFilters}
          searchPlaceholder="Search reference, network, wallet…"
          hasActiveFilters={hasActiveFilters}
        />
        <div className={cardClasses + " p-0 overflow-hidden"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Reference</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Amount</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Fee</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Network</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Payment</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-text-phantom uppercase tracking-wider">Remittance</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((p) => {
                  const explorerUrl = p.transactionHash ? getExplorerUrl(p.network, p.transactionHash) : null;
                  return (
                    <Fragment key={p.id}>
                      <motion.tr
                        onClick={() => toggleRow(p.id)}
                        className="border-b border-border-subtle cursor-pointer hover:bg-fill-ghost/50 transition-colors"
                        initial={false}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-accent">{p.refId}</td>
                        <td className="px-5 py-3 text-text-muted">{formatDate(p.submittedAt)}</td>
                        <td className="px-5 py-3 text-right text-text-secondary">${p.amount}</td>
                        <td className="px-5 py-3 text-right text-text-muted">${p.handlingFeeAmount}</td>
                        <td className="px-5 py-3 text-right font-medium text-text-secondary">${p.totalAmount}</td>
                        <td className="px-5 py-3"><NetworkBadge network={p.network} /></td>
                        <td className="px-5 py-3 font-mono text-xs text-text-muted">{truncateAddr(p.walletAddress)}</td>
                        <td className="px-5 py-3"><StatusBadge status={p.paymentStatus} /></td>
                        <td className="px-5 py-3">
                          {p.remittanceStatus === "remitted" && explorerUrl ? (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Remitted
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </a>
                          ) : (
                            <StatusBadge status={p.remittanceStatus} />
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
                            className="bg-fill-ghost/30"
                          >
                            <td colSpan={9} className="px-5 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-1">Full Wallet Address</p>
                                  <p className="font-mono text-xs text-text-secondary break-all">{p.walletAddress}</p>
                                  {p.walletLabel && (
                                    <p className="text-xs text-text-muted mt-0.5">Label: {p.walletLabel}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-1">Memo</p>
                                  <p className="text-text-secondary">{p.memo || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-1">Fee Breakdown</p>
                                  <p className="text-text-secondary">{p.handlingFeePercent}% (${p.handlingFeeAmount}) on ${p.amount}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-1">Submitted</p>
                                  <p className="text-text-secondary">{formatDateTime(p.submittedAt)}</p>
                                </div>
                                {p.transactionHash && (
                                  <div className="md:col-span-2 border-t border-border-default/20 pt-3 mt-1">
                                    <p className="text-[11px] font-medium text-text-phantom uppercase tracking-wider mb-1">Transaction Hash</p>
                                    <div className="flex items-start gap-2">
                                      <p className="font-mono text-xs text-text-secondary break-all flex-1">{p.transactionHash}</p>
                                      <button
                                        onClick={() => copyToClipboard(p.transactionHash!)}
                                        className="flex-shrink-0 p-1 rounded text-text-muted hover:text-accent transition-colors"
                                        title="Copy hash"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                        </svg>
                                      </button>
                                    </div>
                                    {copied && (
                                      <p className="text-[10px] text-accent mt-1">Copied!</p>
                                    )}
                                    {explorerUrl && (
                                      <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2"
                                      >
                                        View on {EXPLORER_URLS[p.network]?.name || "Explorer"} →
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
