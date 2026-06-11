"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-store";

export interface SavedWallet {
  id: string;
  label: string;
  wallet_address: string;
  network: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export function useSavedWallets() {
  const [wallets, setWallets] = useState<SavedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/wallets");
      if (!res.ok) throw new Error("Failed to fetch wallets");
      const data = await res.json();
      setWallets(data.wallets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const addWallet = useCallback(
    async (payload: { label: string; wallet_address: string; network: string; memo?: string }) => {
      const res = await authFetch("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save wallet");
      }
      await fetchWallets();
    },
    [fetchWallets]
  );

  const updateWallet = useCallback(
    async (id: string, payload: { label?: string; wallet_address?: string; network?: string; memo?: string }) => {
      const res = await authFetch(`/wallets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update wallet");
      }
      await fetchWallets();
    },
    [fetchWallets]
  );

  const deleteWallet = useCallback(
    async (id: string) => {
      const res = await authFetch(`/wallets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete wallet");
      }
      await fetchWallets();
    },
    [fetchWallets]
  );

  return { wallets, loading, error, fetchWallets, addWallet, updateWallet, deleteWallet };
}
