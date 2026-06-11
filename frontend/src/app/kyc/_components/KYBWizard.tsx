"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";
import StepProgress from "./StepProgress";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const STEPS = [
  { number: 1, label: "Business Info" },
  { number: 2, label: "Directors" },
  { number: 3, label: "Documents" },
  { number: 4, label: "Review" },
];

interface FileInfo {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface Director {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  ownershipPercent: string;
  role: string;
  idFile: FileInfo | null;
}

interface VerificationRequest {
  status: string;
  flagged_fields: string[];
  admin_notes: string;
  submission_data: KybState;
}

interface KybState {
  step: number;
  status: "pending" | "submitted" | "approved" | "rejected" | "verification_requested" | "resubmitted";
  flagged_fields?: string[];
  admin_notes?: string;
  resubmission_count?: number;
  previous_submission?: Record<string, unknown>;
  businessInfo: {
    legalBusinessName: string;
    tradingName: string;
    registrationNumber: string;
    incorporationDate: string;
    businessType: string;
    jurisdiction: string;
    businessAddress: string;
    website: string;
    industry: string;
  };
  directors: Director[];
  documents: {
    certificateOfIncorporation: FileInfo | null;
    articlesOfAssociation: FileInfo | null;
    proofOfBusinessAddress: FileInfo | null;
    shareholderRegister: FileInfo | null;
    sourceOfFundsDeclaration: FileInfo | null;
  };
}

const defaultKyb: KybState = {
  step: 1,
  status: "pending",
  businessInfo: {
    legalBusinessName: "",
    tradingName: "",
    registrationNumber: "",
    incorporationDate: "",
    businessType: "",
    jurisdiction: "",
    businessAddress: "",
    website: "",
    industry: "",
  },
  directors: [],
  documents: {
    certificateOfIncorporation: null,
    articlesOfAssociation: null,
    proofOfBusinessAddress: null,
    shareholderRegister: null,
    sourceOfFundsDeclaration: null,
  },
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ACCENT = "#20aab6";

const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#20aab6]/50 focus:ring-1 focus:ring-[#20aab6]/25 transition-colors";

const inputErrorCls =
  "w-full bg-white/[0.04] border border-red-500/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/25 transition-colors";

const inputFlaggedCls =
  "w-full bg-white/[0.04] border border-red-500 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-colors";

const inputAcceptedCls =
  "w-full bg-white/[0.04] border border-green-500/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/25 transition-colors disabled:opacity-70 disabled:cursor-not-allowed";

function getInputCls(fieldName: string, hasError: boolean, isVR: boolean, flagged: string[]): string {
  if (hasError) return inputErrorCls;
  if (isVR && flagged.includes(fieldName)) return inputFlaggedCls;
  if (isVR && !flagged.includes(fieldName)) return inputAcceptedCls;
  return inputCls;
}

function isFieldDisabled(isVR: boolean, fieldName: string, flagged: string[]): boolean {
  return isVR && !flagged.includes(fieldName);
}

const labelCls = "block text-[13px] text-white/60 mb-1.5";

const COUNTRIES = [
  "TT|Trinidad & Tobago", "JM|Jamaica", "BS|Bahamas", "US|United States",
  "CA|Canada", "GB|United Kingdom", "GY|Guyana", "BB|Barbados", "OTHER|Other",
];

const INDUSTRIES = [
  "Technology", "Financial Services", "Retail / E-commerce", "Real Estate",
  "Healthcare", "Education", "Hospitality / Tourism", "Manufacturing",
  "Construction", "Legal Services", "Agriculture", "Logistics / Transport",
  "Energy / Utilities", "Media / Entertainment", "Other",
];

/* ═══════ Sub-components (file scope, not inside main component) ═══════ */

function Field({ label, error, flagged, children }: { label: string; error?: string; flagged?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {flagged && <p className="text-red-400 text-xs mb-1">This field requires attention</p>}
      {children}
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
}

function DocUpload({
  label,
  required,
  file,
  error,
  onFile,
  flagged,
  accepted,
}: {
  label: string;
  required: boolean;
  file: FileInfo | null;
  error?: string;
  onFile: (f: File) => void;
  flagged?: boolean;
  accepted?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  };

  const borderColor = flagged
    ? "border-red-500/50"
    : dragOver
      ? "border-[#20aab6]/50 bg-[#20aab6]/5"
      : error
        ? "border-red-500/30"
        : "border-white/[0.08] hover:border-[#20aab6]/20";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-[13px] text-white/60">{label}</label>
        <span className={"text-[10px] px-1.5 py-0.5 rounded-full " + (required ? "bg-red-500/10 text-red-300/70" : "bg-white/[0.04] text-white/25")}>
          {required ? "Required" : "Optional"}
        </span>
      </div>

      {/* Accepted document preview */}
      {accepted && file && !flagged ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center gap-3 relative">
          {file.preview && file.type !== "application/pdf" ? (
            <div className="relative">
              <img src={file.preview} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.1]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-green-300 truncate">{file.name}</p>
            <p className="text-[10px] text-green-400/60">Previously accepted - no action needed</p>
          </div>
        </div>
      ) : !file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={"border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all " + borderColor}
        >
          <svg className="w-6 h-6 text-white/15 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-[12px] text-white/30"><span className="text-[#20aab6]">Click to upload</span> or drag & drop</p>
          <p className="text-[10px] text-white/15 mt-0.5">JPG, PNG or PDF - Max 20MB</p>
          {flagged && <p className="text-[10px] text-red-400 mt-1">This document needs to be re-uploaded</p>}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.1] rounded-xl p-3 flex items-center gap-3">
          {file.preview && file.type !== "application/pdf" ? (
            <img src={file.preview} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.1]" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white/60 truncate">{file.name}</p>
            <p className="text-[10px] text-white/25">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => onFile(null as unknown as File)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">{title}</h3>
        <button onClick={onEdit} className="text-[12px] text-[#20aab6] hover:underline font-medium">Edit</button>
      </div>
      <div className="px-4 py-2 space-y-0.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[13px] text-white/35">{label}</span>
      <span className="text-[13px] text-white/75">{value}</span>
    </div>
  );
}

function NavBtn({ onNext, onBack, saving, submitLabel, isSubmit }: { onNext: () => void; onBack?: () => void; saving: boolean; submitLabel?: string; isSubmit?: boolean }) {
  return (
    <div className="flex gap-3 mt-8">
      {onBack && (
        <button onClick={onBack} className="flex-1 px-6 py-3 rounded-full text-[14px] font-medium text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all">
          Back
        </button>
      )}
      <motion.button onClick={onNext} disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] transition-all disabled:opacity-50">
        {saving ? (isSubmit ? "Submitting\u2026" : "Saving\u2026") : (submitLabel || "Continue")}
      </motion.button>
    </div>
  );
}

/* ═══════ Main Component ═══════ */

export default function KYBWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [kyb, setKyb] = useState<KybState>(defaultKyb);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDirectorForm, setShowDirectorForm] = useState(false);
  const [editingDirectorIdx, setEditingDirectorIdx] = useState<number | null>(null);
  const [directorDraft, setDirectorDraft] = useState<Director>({
    fullName: "", dateOfBirth: "", nationality: "", ownershipPercent: "", role: "", idFile: null,
  });
  const [vrStatus, setVrStatus] = useState<VerificationRequest | null>(null);
  const [vrLoading, setVrLoading] = useState(true);
  const hasUnsavedChanges = useRef(false);

  const isVerificationRequested = kyb.status === "verification_requested";
  const flaggedFields: string[] = vrStatus?.flagged_fields ?? [];

  // Fetch full KYC data on mount to check for verification_requested
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_BASE + "/auth/kyc", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const fullKyb = data.kyc as KybState;
          if (fullKyb?.status === "verification_requested") {
            setVrStatus({
              status: fullKyb.status,
              flagged_fields: fullKyb.flagged_fields ?? [],
              admin_notes: fullKyb.admin_notes ?? "",
              submission_data: fullKyb,
            });
            // Prefill form from submission_data — keep all values, don't clear flagged fields
            const sd = fullKyb;
            const prefilled: KybState = { ...defaultKyb, ...sd, step: 1 };
            console.log("[KYB VR INIT] status:", prefilled.status, "flagged_fields:", prefilled.flagged_fields, "registrationNumber:", prefilled.businessInfo?.registrationNumber, "businessType:", prefilled.businessInfo?.businessType);
            setKyb(prefilled);
          } else if (fullKyb?.status === "resubmitted") {
            setKyb({ ...defaultKyb, ...fullKyb, status: "submitted" });
          } else if (user?.kyc_data) {
            const raw = user.kyc_data as unknown as Record<string, unknown>;
            setKyb({
              ...defaultKyb,
              ...(raw as unknown as Partial<KybState>),
              businessInfo: { ...defaultKyb.businessInfo, ...((raw.businessInfo ?? {}) as Record<string, string>) },
              documents: { ...defaultKyb.documents, ...((raw.documents ?? {}) as Record<string, unknown>) },
              directors: Array.isArray(raw.directors) ? (raw.directors as Director[]) : [],
            });
          }
        }
      } catch (err) {
        console.error("KYB status fetch error:", err);
      } finally {
        setVrLoading(false);
      }
    })();
  }, []);

  // Navigation guard for verification_requested
  useEffect(() => {
    if (!isVerificationRequested) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Your KYC needs to be resubmitted.";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isVerificationRequested]);

  // Track unsaved changes when user edits fields
  useEffect(() => {
    if (!isVerificationRequested) return;
    hasUnsavedChanges.current = true;
  }, [kyb, isVerificationRequested]);

  const save = useCallback(async (data: Partial<KybState>) => {
    setSaving(true);
    try {
      const res = await fetch(API_BASE + "/auth/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kycData: data }),
      });
      const json = await res.json();
      if (json.kyc) {
        if (isVerificationRequested) {
          // Only update step in VR mode — don't overwrite user edits with stale server data
          setKyb((prev) => ({ ...prev, step: (json.kyc as Record<string, unknown>).step as number ?? prev.step }));
        } else {
          setKyb((prev) => ({ ...prev, ...json.kyc } as KybState));
        }
      }
    } catch (err) {
      console.error("KYB save error:", err);
    } finally {
      setSaving(false);
    }
  }, [isVerificationRequested]);

  const goTo = (step: number) => {
    setErrors({});
    if (isVerificationRequested) {
      setKyb((p) => ({ ...p, step }));
    } else {
      save({ step });
    }
  };
  const next = () => {
    setErrors({});
    if (!validateStep()) return;
    if (isVerificationRequested) {
      setKyb((p) => ({ ...p, step: Math.min(p.step + 1, 4) }));
    } else {
      save({ step: Math.min(kyb.step + 1, 4) });
    }
  };
  const back = () => {
    setErrors({});
    if (isVerificationRequested) {
      setKyb((p) => ({ ...p, step: Math.max(p.step - 1, 1) }));
    } else {
      save({ step: Math.max(kyb.step - 1, 1) });
    }
  };

  // ─── Validation ───
  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (kyb.step === 1) {
      const b = kyb.businessInfo;
      if (!b.legalBusinessName.trim()) e.legalBusinessName = "Required";
      if (!b.tradingName.trim()) e.tradingName = "Required";
      if (!b.registrationNumber.trim()) e.registrationNumber = "Required";
      if (!b.incorporationDate) e.incorporationDate = "Required";
      if (!b.businessType) e.businessType = "Required";
      if (!b.jurisdiction) e.jurisdiction = "Required";
      if (!b.businessAddress.trim()) e.businessAddress = "Required";
      if (!b.industry) e.industry = "Required";
    }
    if (kyb.step === 2) {
      if (kyb.directors.length === 0) e.directors = "Add at least 1 director";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── File handling ───
  const handleFile = useCallback(
    (field: keyof KybState["documents"], file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setErrors((p) => ({ ...p, [field]: "Max 20MB" }));
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(file.type)) {
        setErrors((p) => ({ ...p, [field]: "Only images and PDF files are accepted" }));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const info: FileInfo = { name: file.name, size: file.size, type: file.type, preview: reader.result as string };
        setKyb((p) => ({ ...p, documents: { ...p.documents, [field]: info } }));
        setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDirectorFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDirectorDraft((p) => ({
        ...p,
        idFile: { name: file.name, size: file.size, type: file.type, preview: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  // ─── Director CRUD ───
  const saveDirector = () => {
    const d = directorDraft;
    if (!d.fullName.trim() || !d.dateOfBirth || !d.nationality || !d.role.trim()) {
      setErrors((p) => ({ ...p, directorForm: "Fill all required fields" }));
      return;
    }
    setErrors((p) => { const n = { ...p }; delete n.directorForm; return n; });

    if (editingDirectorIdx !== null) {
      setKyb((p) => {
        const updated = [...p.directors];
        updated[editingDirectorIdx] = d;
        return { ...p, directors: updated };
      });
      setEditingDirectorIdx(null);
    } else {
      setKyb((p) => ({ ...p, directors: [...p.directors, d] }));
    }
    setDirectorDraft({ fullName: "", dateOfBirth: "", nationality: "", ownershipPercent: "", role: "", idFile: null });
    setShowDirectorForm(false);
  };

  const editDirector = (idx: number) => {
    setDirectorDraft(kyb.directors[idx]);
    setEditingDirectorIdx(idx);
    setShowDirectorForm(true);
  };

  const removeDirector = (idx: number) => {
    setKyb((p) => ({ ...p, directors: p.directors.filter((_, i) => i !== idx) }));
  };

  // ─── Submit ───
  const submit = async () => {
    setSubmitting(true);
    try {
      const endpoint = isVerificationRequested ? API_BASE + "/kyb/resubmit" : API_BASE + "/kyb/submit";
      console.log("[KYB SUBMIT] endpoint:", endpoint);
      console.log("[KYB SUBMIT] kyb.status:", kyb.status);
      console.log("[KYB SUBMIT] isVerificationRequested:", isVerificationRequested);
      console.log("[KYB SUBMIT] flaggedFields:", flaggedFields);
      console.log("[KYB SUBMIT] kycData.businessInfo.registrationNumber:", kyb.businessInfo.registrationNumber);
      console.log("[KYB SUBMIT] kycData.businessInfo.businessType:", kyb.businessInfo.businessType);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kycData: kyb }),
      });
      const responseJson = await res.json();
      console.log("[KYB SUBMIT] response status:", res.status);
      console.log("[KYB SUBMIT] response body:", JSON.stringify(responseJson));
      if (res.ok) {
        hasUnsavedChanges.current = false;
        setKyb((p) => ({ ...p, status: "resubmitted" }));
      } else {
        console.error("[KYB SUBMIT] server error:", responseJson);
      }
    } catch (err) {
      console.error("[KYB SUBMIT] fetch error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ───
  if (vrLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-5 h-5 border-2 border-[#20aab6]/30 border-t-[#20aab6] rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Under Review / Resubmission received ───
  if (kyb.status === "submitted" || kyb.status === "resubmitted") {
    const isResubmitted = kyb.status === "resubmitted";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
        <div className={"w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 " + (isResubmitted ? "bg-emerald-500/10" : "bg-[#20aab6]/10")}>
          <svg className={"w-10 h-10 " + (isResubmitted ? "text-emerald-400" : "text-[#20aab6]")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">{isResubmitted ? "Resubmission Received" : "Under Review"}</h2>
        <p className="text-white/40 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
          {isResubmitted
            ? "Your updated submission has been received and is being reviewed by our team."
            : "Your business documents are being reviewed. You will receive an email once verification is complete."}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[13px] text-white/50">Estimated review: 3-5 business days</span>
        </div>
        <div className="mt-8">
          <button onClick={() => router.push("/dashboard")} className="px-8 py-3 rounded-full text-[14px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-shadow">
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── Verification Requested Banner ───
  const vrBanner = isVerificationRequested ? (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <h3 className="text-[14px] font-semibold text-amber-300">Your submission requires attention</h3>
          {vrStatus?.admin_notes && (
            <p className="text-[13px] text-amber-300/60 mt-1">{vrStatus.admin_notes}</p>
          )}
          <p className="text-[12px] text-amber-300/40 mt-1">The highlighted fields below need to be reviewed and corrected.</p>
        </div>
      </div>
    </motion.div>
  ) : null;

  return (
    <div>
      {vrBanner}

      <StepProgress steps={STEPS} currentStep={kyb.step} />

      <AnimatePresence mode="wait">
        {/* ═══════ STEP 1: Business Info ═══════ */}
        {kyb.step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Business Information</h2>
            <p className="text-white/40 text-sm mb-6">Provide your company&apos;s registered legal details.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Legal business name *" error={errors.legalBusinessName} flagged={flaggedFields.includes("legalBusinessName") && isVerificationRequested}>
                  <input className={getInputCls("legalBusinessName", !!errors.legalBusinessName, isVerificationRequested, flaggedFields)} value={kyb.businessInfo.legalBusinessName} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, legalBusinessName: e.target.value } }))} placeholder="Acme Corp Ltd." disabled={isFieldDisabled(isVerificationRequested, "legalBusinessName", flaggedFields)} />
                </Field>
                <Field label="Trading name *" error={errors.tradingName} flagged={flaggedFields.includes("tradingName") && isVerificationRequested}>
                  <input className={getInputCls("tradingName", !!errors.tradingName, isVerificationRequested, flaggedFields)} value={kyb.businessInfo.tradingName} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, tradingName: e.target.value } }))} placeholder="Acme" disabled={isFieldDisabled(isVerificationRequested, "tradingName", flaggedFields)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Registration number *" error={errors.registrationNumber} flagged={flaggedFields.includes("registrationNumber") && isVerificationRequested}>
                  <input className={getInputCls("registrationNumber", !!errors.registrationNumber, isVerificationRequested, flaggedFields)} value={kyb.businessInfo.registrationNumber} onChange={(e) => { console.log("[KYB FIELD CHANGE] registrationNumber:", e.target.value, "flagged:", flaggedFields.includes("registrationNumber"), "disabled:", isFieldDisabled(isVerificationRequested, "registrationNumber", flaggedFields), "isVR:", isVerificationRequested); setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, registrationNumber: e.target.value } })); }} placeholder="AB-12345" disabled={isFieldDisabled(isVerificationRequested, "registrationNumber", flaggedFields)} />
                </Field>
                <Field label="Incorporation date *" error={errors.incorporationDate} flagged={flaggedFields.includes("incorporationDate") && isVerificationRequested}>
                  <input type="date" className={getInputCls("incorporationDate", !!errors.incorporationDate, isVerificationRequested, flaggedFields) + " [color-scheme:dark]"} value={kyb.businessInfo.incorporationDate} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, incorporationDate: e.target.value } }))} disabled={isFieldDisabled(isVerificationRequested, "incorporationDate", flaggedFields)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business type *" error={errors.businessType} flagged={flaggedFields.includes("businessType") && isVerificationRequested}>
                  <select className={getInputCls("businessType", !!errors.businessType, isVerificationRequested, flaggedFields) + " [color-scheme:dark]"} value={kyb.businessInfo.businessType} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, businessType: e.target.value } }))} disabled={isFieldDisabled(isVerificationRequested, "businessType", flaggedFields)}>
                    <option value="" className="bg-[#0d0f1a]">Select type</option>
                    <option value="LLC" className="bg-[#0d0f1a]">LLC</option>
                    <option value="Corp" className="bg-[#0d0f1a]">Corporation</option>
                    <option value="Partnership" className="bg-[#0d0f1a]">Partnership</option>
                    <option value="Other" className="bg-[#0d0f1a]">Other</option>
                  </select>
                </Field>
                <Field label="Jurisdiction *" error={errors.jurisdiction} flagged={flaggedFields.includes("jurisdiction") && isVerificationRequested}>
                  <select className={getInputCls("jurisdiction", !!errors.jurisdiction, isVerificationRequested, flaggedFields) + " [color-scheme:dark]"} value={kyb.businessInfo.jurisdiction} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, jurisdiction: e.target.value } }))} disabled={isFieldDisabled(isVerificationRequested, "jurisdiction", flaggedFields)}>
                    <option value="" className="bg-[#0d0f1a]">Select jurisdiction</option>
                    {COUNTRIES.map((c) => { const [val, lbl] = c.split("|"); return <option key={val} value={val} className="bg-[#0d0f1a]">{lbl}</option>; })}
                  </select>
                </Field>
              </div>

              <Field label="Business address *" error={errors.businessAddress} flagged={flaggedFields.includes("businessAddress") && isVerificationRequested}>
                <input className={getInputCls("businessAddress", !!errors.businessAddress, isVerificationRequested, flaggedFields)} value={kyb.businessInfo.businessAddress} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, businessAddress: e.target.value } }))} placeholder="123 Commerce Blvd, Port of Spain" disabled={isFieldDisabled(isVerificationRequested, "businessAddress", flaggedFields)} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Website">
                  <input className={getInputCls("website", false, isVerificationRequested, flaggedFields)} value={kyb.businessInfo.website} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, website: e.target.value } }))} placeholder="https://example.com" disabled={isFieldDisabled(isVerificationRequested, "website", flaggedFields)} />
                </Field>
                <Field label="Industry *" error={errors.industry} flagged={flaggedFields.includes("industry") && isVerificationRequested}>
                  <select className={getInputCls("industry", !!errors.industry, isVerificationRequested, flaggedFields) + " [color-scheme:dark]"} value={kyb.businessInfo.industry} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, industry: e.target.value } }))} disabled={isFieldDisabled(isVerificationRequested, "industry", flaggedFields)}>
                    <option value="" className="bg-[#0d0f1a]">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-[#0d0f1a]">{i}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <NavBtn onNext={next} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 2: Directors ═══════ */}
        {kyb.step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Directors & Officers</h2>
            <p className="text-white/40 text-sm mb-6">Add all directors, shareholders with 25%+ ownership, or authorized signatories.</p>

            {errors.directors && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <p className="text-[13px] text-red-300">{errors.directors}</p>
              </div>
            )}

            {/* Director cards */}
            {kyb.directors.length > 0 && (
              <div className="space-y-3 mb-5">
                {kyb.directors.map((d, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex items-start gap-3">
                    {d.idFile?.preview && d.idFile.type !== "application/pdf" ? (
                      <img src={d.idFile.preview} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.1] shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium">{d.fullName}</p>
                      <p className="text-[12px] text-white/35">{d.role}{d.ownershipPercent ? ' · ' + d.ownershipPercent + '% ownership' : ''}</p>
                      <p className="text-[11px] text-white/20">{d.nationality} · DOB: {d.dateOfBirth || '—'}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => editDirector(i)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-[#20aab6] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                        </svg>
                      </button>
                      <button onClick={() => removeDirector(i)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-red-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit director form */}
            <AnimatePresence>
              {showDirectorForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3 mb-4">
                    <p className="text-[13px] text-white/50 font-medium">{editingDirectorIdx !== null ? "Edit Director" : "Add Director"}</p>
                    {errors.directorForm && <p className="text-red-400 text-[11px]">{errors.directorForm}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Full name *</label>
                        <input className={inputCls} value={directorDraft.fullName} onChange={(e) => setDirectorDraft((p) => ({ ...p, fullName: e.target.value }))} placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className={labelCls}>Date of birth *</label>
                        <input type="date" className={inputCls + " [color-scheme:dark]"} value={directorDraft.dateOfBirth} onChange={(e) => setDirectorDraft((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Nationality *</label>
                        <select className={inputCls + " [color-scheme:dark]"} value={directorDraft.nationality} onChange={(e) => setDirectorDraft((p) => ({ ...p, nationality: e.target.value }))}>
                          <option value="" className="bg-[#0d0f1a]">Select</option>
                          {COUNTRIES.map((c) => { const [val, lbl] = c.split("|"); return <option key={val} value={val} className="bg-[#0d0f1a]">{lbl}</option>; })}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Ownership %</label>
                        <input type="number" min="0" max="100" className={inputCls} value={directorDraft.ownershipPercent} onChange={(e) => setDirectorDraft((p) => ({ ...p, ownershipPercent: e.target.value }))} placeholder="25" />
                      </div>
                      <div>
                        <label className={labelCls}>Role *</label>
                        <select className={inputCls + " [color-scheme:dark]"} value={directorDraft.role} onChange={(e) => setDirectorDraft((p) => ({ ...p, role: e.target.value }))}>
                          <option value="" className="bg-[#0d0f1a]">Select</option>
                          <option value="Director" className="bg-[#0d0f1a]">Director</option>
                          <option value="CEO" className="bg-[#0d0f1a]">CEO</option>
                          <option value="CFO" className="bg-[#0d0f1a]">CFO</option>
                          <option value="Secretary" className="bg-[#0d0f1a]">Company Secretary</option>
                          <option value="Shareholder" className="bg-[#0d0f1a]">Shareholder</option>
                          <option value="Other" className="bg-[#0d0f1a]">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Passport upload */}
                    <div>
                      <label className={labelCls}>Passport / ID (front)</label>
                      {!directorDraft.idFile ? (
                        <div
                          onClick={() => document.getElementById("director-id-upload")?.click()}
                          className="border-2 border-dashed border-white/[0.08] rounded-xl p-4 text-center cursor-pointer hover:border-[#20aab6]/20 transition-colors"
                        >
                          <p className="text-[12px] text-white/30"><span className="text-[#20aab6]">Click to upload</span> or drag & drop</p>
                          <p className="text-[10px] text-white/15 mt-0.5">JPG, PNG or PDF - Max 20MB</p>
                          <input id="director-id-upload" type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleDirectorFile(e.target.files[0]); }} />
                        </div>
                      ) : (
                        <div className="bg-white/[0.04] border border-white/[0.1] rounded-xl p-2.5 flex items-center gap-3">
                          {directorDraft.idFile.preview && directorDraft.idFile.type !== "application/pdf" ? (
                            <img src={directorDraft.idFile.preview} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.1]" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-white/60 truncate">{directorDraft.idFile.name}</p>
                            <p className="text-[10px] text-white/25">{(directorDraft.idFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button onClick={() => setDirectorDraft((p) => ({ ...p, idFile: null }))} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={saveDirector} className="text-[13px] font-medium text-white bg-[#20aab6] px-5 py-2 rounded-full hover:bg-[#20aab6]/80 transition-colors">
                        {editingDirectorIdx !== null ? "Save Changes" : "Add Director"}
                      </button>
                      <button onClick={() => { setShowDirectorForm(false); setEditingDirectorIdx(null); setDirectorDraft({ fullName: "", dateOfBirth: "", nationality: "", ownershipPercent: "", role: "", idFile: null }); }} className="text-[13px] text-white/40 px-4 py-2 hover:text-white/60 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showDirectorForm && (
              <button onClick={() => { setShowDirectorForm(true); setEditingDirectorIdx(null); }} className="flex items-center gap-2 text-[13px] text-[#20aab6] font-medium hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add Director
              </button>
            )}

            <NavBtn onNext={next} onBack={back} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 3: Documents ═══════ */}
        {kyb.step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Business Documents</h2>
            <p className="text-white/40 text-sm mb-6">Upload the required documents for verification.</p>

            <div className="space-y-4">
              <DocUpload
                label="Certificate of Incorporation"
                required
                file={kyb.documents.certificateOfIncorporation}
                error={errors.certificateOfIncorporation}
                onFile={(f) => handleFile("certificateOfIncorporation", f)}
                flagged={flaggedFields.includes("certificateOfIncorporation") && isVerificationRequested}
                accepted={!flaggedFields.includes("certificateOfIncorporation") && isVerificationRequested && !!kyb.documents.certificateOfIncorporation}
              />
              <DocUpload
                label="Articles of Association"
                required
                file={kyb.documents.articlesOfAssociation}
                error={errors.articlesOfAssociation}
                onFile={(f) => handleFile("articlesOfAssociation", f)}
                flagged={flaggedFields.includes("articlesOfAssociation") && isVerificationRequested}
                accepted={!flaggedFields.includes("articlesOfAssociation") && isVerificationRequested && !!kyb.documents.articlesOfAssociation}
              />
              <DocUpload
                label="Proof of Business Address"
                required
                file={kyb.documents.proofOfBusinessAddress}
                error={errors.proofOfBusinessAddress}
                onFile={(f) => handleFile("proofOfBusinessAddress", f)}
                flagged={flaggedFields.includes("proofOfBusinessAddress") && isVerificationRequested}
                accepted={!flaggedFields.includes("proofOfBusinessAddress") && isVerificationRequested && !!kyb.documents.proofOfBusinessAddress}
              />
              <DocUpload
                label="Shareholder Register"
                required={false}
                file={kyb.documents.shareholderRegister}
                error={errors.shareholderRegister}
                onFile={(f) => handleFile("shareholderRegister", f)}
                flagged={flaggedFields.includes("shareholderRegister") && isVerificationRequested}
                accepted={!flaggedFields.includes("shareholderRegister") && isVerificationRequested && !!kyb.documents.shareholderRegister}
              />
              <DocUpload
                label="Source of Funds Declaration"
                required={false}
                file={kyb.documents.sourceOfFundsDeclaration}
                error={errors.sourceOfFundsDeclaration}
                onFile={(f) => handleFile("sourceOfFundsDeclaration", f)}
                flagged={flaggedFields.includes("sourceOfFundsDeclaration") && isVerificationRequested}
                accepted={!flaggedFields.includes("sourceOfFundsDeclaration") && isVerificationRequested && !!kyb.documents.sourceOfFundsDeclaration}
              />
            </div>

            <NavBtn onNext={next} onBack={back} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 4: Review & Submit ═══════ */}
        {kyb.step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Review & Submit</h2>
            <p className="text-white/40 text-sm mb-6">Confirm everything is correct before submitting.</p>

            <div className="space-y-4">
              <ReviewSection title="Business Information" onEdit={() => goTo(1)}>
                <ReviewRow label="Legal name" value={kyb.businessInfo.legalBusinessName || "\u2014"} />
                <ReviewRow label="Trading name" value={kyb.businessInfo.tradingName || "\u2014"} />
                <ReviewRow label="Reg. #" value={kyb.businessInfo.registrationNumber || "\u2014"} />
                <ReviewRow label="Incorporation" value={kyb.businessInfo.incorporationDate || "\u2014"} />
                <ReviewRow label="Type" value={kyb.businessInfo.businessType || "\u2014"} />
                <ReviewRow label="Jurisdiction" value={kyb.businessInfo.jurisdiction || "\u2014"} />
                <ReviewRow label="Address" value={kyb.businessInfo.businessAddress || "\u2014"} />
                <ReviewRow label="Website" value={kyb.businessInfo.website || "\u2014"} />
                <ReviewRow label="Industry" value={kyb.businessInfo.industry || "\u2014"} />
              </ReviewSection>

              <ReviewSection title={"Directors (" + kyb.directors.length + ")"} onEdit={() => goTo(2)}>
                {kyb.directors.length === 0 ? (
                  <p className="text-[13px] text-white/30 py-2">No directors added</p>
                ) : (
                  kyb.directors.map((d, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <span className="text-[13px] text-white/35">{d.role}</span>
                      <span className="text-[13px] text-white/75">{d.fullName}{d.ownershipPercent ? " (" + d.ownershipPercent + "%)" : ""}</span>
                    </div>
                  ))
                )}
              </ReviewSection>

              <ReviewSection title="Documents" onEdit={() => goTo(3)}>
                <ReviewRow label="Certificate of Incorporation" value={kyb.documents.certificateOfIncorporation?.name || "Not uploaded"} />
                <ReviewRow label="Articles of Association" value={kyb.documents.articlesOfAssociation?.name || "Not uploaded"} />
                <ReviewRow label="Proof of Address" value={kyb.documents.proofOfBusinessAddress?.name || "Not uploaded"} />
                <ReviewRow label="Shareholder Register" value={kyb.documents.shareholderRegister?.name || "Not uploaded"} />
                <ReviewRow label="Source of Funds" value={kyb.documents.sourceOfFundsDeclaration?.name || "Not uploaded"} />
              </ReviewSection>
            </div>

            <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-[13px] text-amber-300/80 leading-relaxed">
                By submitting, you confirm all information is accurate and documents are genuine. PSI will review your business within 3-5 business days.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={back} className="flex-1 px-6 py-3 rounded-full text-[14px] font-medium text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all">
                Back
              </button>
              <motion.button onClick={submit} disabled={submitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] transition-all disabled:opacity-50">
                {submitting ? "Submitting\u2026" : (isVerificationRequested ? "Resubmit for Review" : "Submit for Review")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
