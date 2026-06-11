"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Module-level cache — shared across all hook instances
let cachedFee: number | null = null;
let cachedAt: number = 0;
let inflight: Promise<number | null> | null = null;

export function usePlatformFee() {
  const [fee, setFee] = useState<number | null>(cachedFee);
  const [loading, setLoading] = useState(cachedFee === null);

  useEffect(() => {
    const now = Date.now();
    if (cachedFee !== null && now - cachedAt < CACHE_TTL) {
      setFee(cachedFee);
      setLoading(false);
      return;
    }

    if (!inflight) {
      inflight = fetch(API_BASE + "/settings/crypto-fee")
        .then((r) => r.json())
        .then((d) => {
          const val = parseFloat(d.fee) || 0;
          cachedFee = val;
          cachedAt = Date.now();
          inflight = null;
          return val;
        })
        .catch(() => {
          inflight = null;
          return cachedFee;
        });
    }

    inflight.then((val) => {
      if (val !== null) setFee(val);
      setLoading(false);
    });
  }, []);

  return { fee: fee ?? 0, loading };
}
