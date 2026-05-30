"use client";

import { useAuth } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import KYCWizard from "./_components/KYCWizard";
import KYBWizard from "./_components/KYBWizard";

export default function KYCPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    // If KYC already approved, redirect to dashboard
    if (!loading && user?.kyc_data?.status === "approved") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  const isRejected = user.kyc_data?.status === "rejected";
  const rejectionReason = user.kyc_data?.rejectionReason;

  return (
    <div className="min-h-screen bg-[#07080F] text-white antialiased">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#0a0b14]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#20aab6] flex items-center justify-center font-bold text-white text-[10px]">
            P
          </div>
          <span className="text-sm font-semibold tracking-wide">PSI</span>
          <span className="text-white/20 text-sm mx-2">|</span>
          <span className="text-sm text-white/40">
            {user.role === "business" ? "Business Verification" : "Identity Verification"}
          </span>
        </div>
      </div>

      {/* Rejection banner */}
      {isRejected && rejectionReason && (
        <div className="max-w-3xl mx-auto px-6 mt-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-[14px] font-semibold text-red-300">Verification Not Approved</h3>
            </div>
            <p className="text-[13px] text-red-300/60 mb-2">Please address the issue below and re-submit your documents.</p>
            <div className="bg-red-500/5 rounded-lg px-3 py-2">
              <p className="text-[12px] text-red-300/80">{rejectionReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Wizard */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {user.role === "business" ? <KYBWizard /> : <KYCWizard />}
      </div>
    </div>
  );
}
