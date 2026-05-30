"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error to console so we can see it in PM2 logs or browser devtools
    console.error("[Dashboard Error Boundary]", error);
    // Also post it somewhere server-side can see
    fetch("/api/auth/me", { method: "OPTIONS" }).catch(() => {}); // just a ping
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full bg-surface-0">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-error-fill flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-secondary mb-2">Something went wrong</h2>
        <p className="text-sm text-text-faint mb-4 break-all">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
