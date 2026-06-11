"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-store";

const cardClasses = "bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-xl p-5";
const inputClasses =
  "w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors";

const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

// ──────────────────────────────────────────────
// Inline SVGs
// ──────────────────────────────────────────────
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Page Component
// ──────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [fee, setFee] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedByName, setUpdatedByName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<{ previous_fee: string | null; new_fee: string | null; admin_name: string; timestamp: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFee = async () => {
    try {
      const res = await authFetch("/admin/settings/crypto-fee");
      if (res.ok) {
        const data = await res.json();
        setFee(data.fee);
        setUpdatedAt(data.updated_at);
        setUpdatedByName(data.updated_by_name);
        setEditValue(data.fee);
      }
    } catch {
      // silent
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await authFetch("/admin/settings/crypto-fee/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchFee();
    fetchHistory();
  }, []);

  const handleSave = async () => {
    setFormError(null);
    const numVal = parseFloat(editValue);

    if (isNaN(numVal) || editValue.trim() === "") {
      setFormError("Fee must be a valid number");
      return;
    }
    if (numVal < 0 || numVal > 100) {
      setFormError("Fee must be between 0 and 100");
      return;
    }
    // Check max 2 decimal places
    if (editValue.includes(".") && editValue.split(".")[1].length > 2) {
      setFormError("Maximum 2 decimal places allowed");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch("/admin/settings/crypto-fee", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee: numVal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update fee");
      }
      await fetchFee();
      await fetchHistory();
      setEditing(false);
      showToast("Fee updated successfully");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(fee || "0");
    setFormError(null);
    setEditing(false);
  };

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/90 text-white text-xs font-medium rounded-lg shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-secondary">Platform Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage global platform configuration</p>
      </div>

      {/* Fee card */}
      <div className={cardClasses}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-secondary">Crypto Handling Fee</h2>
            <p className="text-xs text-text-muted mt-1">
              Applied immediately to all new crypto purchases. Current fee is shown to users at checkout.
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setEditValue(fee || "0"); setFormError(null); }}
              className="p-1.5 rounded-lg text-text-phantom hover:text-accent hover:bg-accent-fill/10 transition-colors flex-shrink-0"
              title="Edit fee"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {editing ? (
          /* Inline edit form */
          <div className="border-t border-border-default/30 pt-4">
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                value={editValue}
                onChange={(e) => { setEditValue(e.target.value); setFormError(null); }}
                min={0}
                max={100}
                step={0.01}
                className={inputClasses}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
              <span className="text-sm text-text-muted font-medium">%</span>
            </div>
            {formError && (
              <p className="text-xs text-red-400 mt-2">{formError}</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium text-text-muted border border-border-default rounded-lg hover:bg-fill-subtle/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Fee display */
          <div>
            <p className="text-3xl font-bold text-text-secondary">
              {fee !== null ? fee : "—"}<span className="text-lg font-normal text-text-muted">%</span>
            </p>
            {updatedAt && updatedByName && (
              <p className="text-sm text-text-muted mt-2">
                Last updated {formatDateTime(updatedAt)} by {updatedByName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* History table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Fee Change History</h3>
        <div className={cardClasses}>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">No fee changes recorded yet</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[10px] font-medium text-text-phantom uppercase tracking-wider">
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Changed By</div>
                <div className="col-span-3 text-right">Previous Fee</div>
                <div className="col-span-3 text-right">New Fee</div>
              </div>
              {/* Rows */}
              <div className="divide-y divide-border-default/20">
                {history.map((entry, i) => {
                  const prev = parseFloat(entry.previous_fee || "0");
                  const next = parseFloat(entry.new_fee || "0");
                  const delta = next - prev;
                  let feeColor = "text-text-secondary";
                  if (delta > 0) feeColor = "text-amber-400";
                  else if (delta < 0) feeColor = "text-emerald-400";

                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 px-2 py-2.5 items-center">
                      <div className="col-span-3 text-xs text-text-muted">{formatDateTime(entry.timestamp)}</div>
                      <div className="col-span-3 text-xs text-text-secondary">{entry.admin_name}</div>
                      <div className="col-span-3 text-xs text-text-muted text-right">{entry.previous_fee}%</div>
                      <div className={`col-span-3 text-xs font-medium text-right ${feeColor}`}>
                        {entry.new_fee}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
