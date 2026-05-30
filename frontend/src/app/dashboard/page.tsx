"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-store";

export default function DashboardPage() {
  const { user } = useAuth();
  const kycStatus = user?.kyc_data?.status;
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-fill flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-secondary">Admin Dashboard</h2>
          <p className="text-sm text-text-faint mt-1">Manage KYC reviews from the sidebar.</p>
        </motion.div>
      </div>
    );
  }

  if (kycStatus === "approved") {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-fill flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-secondary">Welcome to your dashboard</h2>
          <p className="text-sm text-text-faint mt-1">Your account is active. More features coming soon.</p>
        </motion.div>
      </div>
    );
  }

  if (kycStatus === "rejected") {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-error-fill flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-secondary">Verification not approved</h2>
          <p className="text-sm text-text-faint mt-1">Your KYC submission was not approved. Please re-submit with updated documents.</p>
          {user?.kyc_data?.rejectionReason && (
            <div className="mt-4 bg-error-fill border border-red-500/20 rounded-xl p-3 text-left">
              <p className="text-[11px] text-red-300/50 uppercase tracking-wide mb-1">Reason</p>
              <p className="text-[13px] text-red-300/80">{user.kyc_data.rejectionReason}</p>
            </div>
          )}
          <a href="/kyc" className="inline-block mt-5 px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
            Re-submit verification
          </a>
        </motion.div>
      </div>
    );
  }

  // submitted or pending — review in progress
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-warning-fill flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-secondary">
          {kycStatus === "submitted" ? "Review in progress" : "Verification required"}
        </h2>
        <p className="text-sm text-text-faint mt-1">
          {kycStatus === "submitted"
            ? "Your documents are being reviewed. We'll notify you once the process is complete. This typically takes 1–3 business days."
            : "Please complete your identity verification to unlock all features."}
        </p>
        {kycStatus !== "submitted" && (
          <a href="/kyc" className="inline-block mt-5 px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
            Start verification
          </a>
        )}
      </motion.div>
    </div>
  );
}
