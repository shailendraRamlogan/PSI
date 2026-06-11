"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface DetailData {
  id: number;
  type: string;
  status: string;
  name: string;
  email: string;
  resubmission_count?: number;
  previous_submission?: Record<string, unknown>;
  kycData?: Record<string, unknown>;
}

function diffFields(previous: Record<string, unknown>, current: Record<string, unknown>): { field: string; oldVal: string; newVal: string }[] {
  const changes: { field: string; oldVal: string; newVal: string }[] = [];
  const labels: Record<string, string> = {
    legalBusinessName: "Legal Name",
    tradingName: "Trading Name",
    registrationNumber: "Reg. Number",
    incorporationDate: "Incorporation Date",
    businessType: "Business Type",
    jurisdiction: "Jurisdiction",
    businessAddress: "Address",
    website: "Website",
    industry: "Industry",
    firstName: "First Name",
    lastName: "Last Name",
    dateOfBirth: "Date of Birth",
    nationality: "Nationality",
    phoneNumber: "Phone Number",
    taxId: "Tax ID",
    idType: "ID Type",
    idNumber: "ID Number",
    streetAddress: "Street",
    city: "City",
    stateProvince: "State",
    postalCode: "Postal Code",
    country: "Country",
  };

  const compare = (section: string) => {
    const prev = previous[section] as Record<string, unknown> | undefined;
    const curr = current[section] as Record<string, unknown> | undefined;
    if (!prev || !curr) return;
    for (const key of Object.keys(curr)) {
      const oldVal = String(prev[key] ?? "");
      const newVal = String(curr[key] ?? "");
      if (oldVal !== newVal) {
        changes.push({
          field: labels[key] || key,
          oldVal,
          newVal,
        });
      }
    }
  };

  compare("businessInfo");
  compare("personalInfo");
  compare("addressDocs");
  compare("identityDocs");
  return changes;
}

export default function ResubmissionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/admin/kyc/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => setDetail(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#20aab6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{error || "Record not found"}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#20aab6] hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  const count = detail.resubmission_count ?? 0;
  const hasHistory = count > 0 && detail.previous_submission;
  const changes = hasHistory ? diffFields(detail.previous_submission!, detail.kycData || {}) : [];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-semibold text-white">Resubmission History</h1>
            <p className="text-[12px] text-white/40">
              {detail.name} ({detail.email}) · {detail.type}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-5">
          <h3 className="text-[12px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Resubmission History
          </h3>
          <p className="text-[12px] text-white/35 mb-4">
            This is resubmission <span className="font-semibold text-amber-400">#{count}</span>
          </p>

          {changes.length === 0 ? (
            <p className="text-[12px] text-white/25 italic">
              No data changes detected — only documents may have been updated
            </p>
          ) : (
            <div className="space-y-3">
              {changes.map((change, i) => (
                <div key={i} className="border-b border-amber-400/10 pb-2.5 last:border-0">
                  <p className="text-[11px] font-medium text-amber-400/70 mb-1">{change.field}</p>
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-white/40 line-through">{change.oldVal || "—"}</span>
                    <span className="text-white/20">→</span>
                    <span className="text-[#20aab6]">{change.newVal || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
