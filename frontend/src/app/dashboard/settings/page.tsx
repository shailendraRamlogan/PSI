"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSavedWallets, type SavedWallet } from "@/hooks/useSavedWallets";
import Select from "@/components/ui/Select";

const inputClasses =
  "w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors";

const labelClasses = "block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider";

const cardClasses = "bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-xl p-5";

const NETWORKS = [
  "Bitcoin", "Ethereum", "BNB Chain", "Tron",
  "Solana", "Polygon", "Avalanche", "Arbitrum", "Optimism", "Base",
];

const NETWORK_BADGES: Record<string, { abbr: string; bg: string; text: string }> = {
  Bitcoin:    { abbr: "BTC", bg: "bg-orange-500/20", text: "text-orange-400" },
  Ethereum:   { abbr: "ETH", bg: "bg-blue-500/20",   text: "text-blue-400" },
  "BNB Chain":{ abbr: "BNB", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  Tron:       { abbr: "TRX", bg: "bg-red-500/20",    text: "text-red-400" },
  Solana:     { abbr: "SOL", bg: "bg-purple-500/20",  text: "text-purple-400" },
  Polygon:    { abbr: "POL", bg: "bg-violet-500/20",  text: "text-violet-400" },
  Avalanche:  { abbr: "AVAX",bg: "bg-red-600/20",     text: "text-red-500" },
  Arbitrum:   { abbr: "ARB", bg: "bg-sky-500/20",    text: "text-sky-400" },
  Optimism:   { abbr: "OP",  bg: "bg-rose-500/20",   text: "text-rose-400" },
  Base:       { abbr: "BASE",bg: "bg-blue-600/20",    text: "text-blue-500" },
};


const WALLET_VALIDATORS: Record<string, {
  regex: RegExp;
  hint: string;
  warning?: boolean;
}> = {
  Bitcoin: {
    regex: /^(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
    hint: "Legacy (starts with 1 or 3) or SegWit (starts with bc1)",
  },
  Ethereum: {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "Starts with 0x, 42 characters total",
  },
  "BNB Chain": {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "Starts with 0x, 42 characters total",
  },
  Tron: {
    regex: /^T[a-zA-Z0-9]{33}$/,
    hint: "Starts with T, 34 characters total",
  },
  Solana: {
    regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    hint: "Base58 format, 32\u201344 characters",
    warning: true,
  },
  Polygon: {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "Starts with 0x, 42 characters total",
  },
  Avalanche: {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "C-Chain format, starts with 0x, 42 characters total",
  },
  Arbitrum: {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "Starts with 0x, 42 characters total",
  },
  Optimism: {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "Starts with 0x, 42 characters total",
  },
  Base: {
    regex: /^0x[a-fA-F0-9]{40}$/,
    hint: "Starts with 0x, 42 characters total",
  },
};

function validateAddress(network: string, address: string): { valid: boolean; error?: string; warning?: string } {
  if (!address || !network) return { valid: true };
  const addr = address.trim();
  const validator = WALLET_VALIDATORS[network];
  if (!validator) return { valid: true };

  if (!validator.regex.test(addr)) {
    if (validator.warning) {
      return { valid: true, warning: `Address format looks unusual for ${network} \u2014 double-check before saving` };
    }
    return { valid: false, error: `Invalid ${network} address format. ${validator.hint}` };
  }
  return { valid: true };
}

function truncateAddress(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

// ──────────────────────────────────────────────
// Inline SVGs
// ──────────────────────────────────────────────
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3a2.25 2.25 0 00-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Wallet Card
// ──────────────────────────────────────────────
function WalletCard({
  wallet,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  isDeleting,
}: {
  wallet: SavedWallet;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  isDeleting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const badge = NETWORK_BADGES[wallet.network] || { abbr: wallet.network.slice(0, 3).toUpperCase(), bg: "bg-fill-subtle", text: "text-text-muted" };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wallet.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${cardClasses} flex items-start justify-between gap-4`}>
      <div className="flex-1 min-w-0">
        {/* Network badge + label */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text}`}>
            {badge.abbr}
          </span>
          <span className="text-xs text-text-muted">{wallet.network}</span>
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-text-secondary mb-1">{wallet.label}</p>

        {/* Address + copy */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">{truncateAddress(wallet.wallet_address)}</span>
          <button
            onClick={handleCopy}
            className="text-text-phantom hover:text-accent transition-colors flex-shrink-0"
            title="Copy address"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <CopyIcon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Memo */}
        {wallet.memo && (
          <p className="text-xs text-text-muted mt-1">
            Memo: <span className="font-mono">{wallet.memo}</span>
          </p>
        )}

        {/* Delete confirmation inline */}
        {confirmDelete && (
          <p className="text-xs text-red-400 mt-2">Are you sure? This cannot be undone.</p>
        )}
      </div>

      {/* Actions */}
      {confirmDelete ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onConfirmDelete()}
            disabled={isDeleting}
            className="px-2.5 py-1.5 text-[10px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "..." : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2.5 py-1.5 text-[10px] font-medium text-text-muted border border-border-default rounded-lg hover:bg-fill-subtle/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-text-phantom hover:text-accent hover:bg-accent-fill/10 transition-colors"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-text-phantom hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Wallet Form
// ──────────────────────────────────────────────
function WalletForm({
  mode,
  initialData,
  onSave,
  onCancel,
}: {
  mode: "add" | "edit";
  initialData?: SavedWallet;
  onSave: (data: { label: string; wallet_address: string; network: string; memo: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialData?.label || "");
  const [network, setNetwork] = useState(initialData?.network || "");
  const [address, setAddress] = useState(initialData?.wallet_address || "");
  const [memo, setMemo] = useState(initialData?.memo || "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const validate = useCallback(() => {
    setAddressError(null);
    setAddressWarning(null);
    if (!network || !address.trim()) return;
    const result = validateAddress(network, address);
    if (result.error) setAddressError(result.error);
    if (result.warning) setAddressWarning(result.warning);
  }, [network, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!label.trim() || !network || !address.trim()) {
      setFormError("Label, network, and wallet address are required.");
      return;
    }

    // Validate address format
    const validation = validateAddress(network, address);
    if (!validation.valid) {
      setAddressError(validation.error || "Invalid address format");
      return;
    }

    setSaving(true);
    try {
      await onSave({ label: label.trim(), wallet_address: address.trim(), network, memo: memo.trim() });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      <div className={`${cardClasses}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-text-secondary">
              {mode === "add" ? "Add Wallet" : "Edit Wallet"}
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className={labelClasses}>Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My ETH Wallet"
              className={inputClasses}
              required
            />
          </div>

          {/* Network */}
          <div>
            <label className={labelClasses}>Blockchain Network</label>
            <Select
              options={NETWORKS.map((n) => ({ value: n, label: n }))}
              value={network}
              onChange={(v) => { setNetwork(v); setAddressWarning(null); }}
              placeholder="Select network"
            />
          </div>

          {/* Wallet Address */}
          <div>
            <label className={labelClasses}>Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressError(null);
                setAddressWarning(null);
              }}
              onBlur={validate}
              placeholder="Enter wallet address"
              className={`${inputClasses} ${addressError ? 'border-red-500/50' : ''}`}
              required
            />
            {network && WALLET_VALIDATORS[network] && (
              <p className="text-xs text-text-muted mt-1">{WALLET_VALIDATORS[network].hint}</p>
            )}
            {addressError && (
              <p className="text-xs text-red-400 mt-1">{addressError}</p>
            )}
            {addressWarning && (
              <p className="text-xs text-amber-400 mt-1">⚠ {addressWarning}</p>
            )}
          </div>

          {/* Memo */}
          <div>
            <label className={labelClasses}>Memo / Destination Tag</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Leave blank if not applicable"
              className={inputClasses}
            />
            <p className="text-[10px] text-text-phantom mt-1">
              Required for networks like XRP, Stellar, and some exchange wallets
            </p>
          </div>

          {/* Error */}
          {formError && (
            <p className="text-xs text-red-400">{formError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-text-muted border border-border-default rounded-lg hover:bg-fill-subtle/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Settings Page
// ──────────────────────────────────────────────
export default function SettingsPage() {
  const { wallets, loading, error, addWallet, updateWallet, deleteWallet } = useSavedWallets();

  const [view, setView] = useState<"list" | "form">("list");
  const [editingWallet, setEditingWallet] = useState<SavedWallet | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = () => {
    setEditingWallet(null);
    setView("form");
  };

  const handleEdit = (wallet: SavedWallet) => {
    setEditingWallet(wallet);
    setView("form");
  };

  const handleCancel = () => {
    setEditingWallet(null);
    setView("list");
  };

  const handleSave = async (data: { label: string; wallet_address: string; network: string; memo: string }) => {
    if (editingWallet) {
      await updateWallet(editingWallet.id, data);
      showToast("Wallet updated successfully");
    } else {
      await addWallet(data);
      showToast("Wallet added successfully");
    }
    setEditingWallet(null);
    setView("list");
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteWallet(id);
      showToast("Wallet deleted");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/90 text-white text-xs font-medium rounded-lg shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Section header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-secondary">Saved Wallets</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage your saved cryptocurrency wallet addresses</p>
        </div>
        {view === "list" && (
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add Wallet
          </button>
        )}
      </div>

      {/* Content */}
      {loading && wallets.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className={`${cardClasses} text-center py-8`}>
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-xs text-accent hover:underline">Retry</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "list" && !loading && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {wallets.length === 0 ? (
              /* Empty state */
              <div className={`${cardClasses} text-center py-12`}>
                <WalletIcon className="w-10 h-10 text-text-phantom mx-auto mb-3" />
                <p className="text-sm font-medium text-text-muted mb-1">No saved wallets</p>
                <p className="text-xs text-text-phantom mb-4">Add your wallet addresses for quick access when sending payments</p>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add your first wallet
                </button>
              </div>
            ) : (
              /* Wallet list */
              <div className="space-y-3">
                {wallets.map((w) => (
                  <WalletCard
                    key={w.id}
                    wallet={w}
                    onEdit={() => handleEdit(w)}
                    onDelete={() => {}}
                    onConfirmDelete={() => handleDelete(w.id)}
                    onCancelDelete={() => {}}
                    isDeleting={isDeleting === w.id}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <WalletForm
              mode={editingWallet ? "edit" : "add"}
              initialData={editingWallet || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
