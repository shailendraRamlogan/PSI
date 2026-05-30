"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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

interface KybState {
  step: number;
  status: "pending" | "submitted" | "approved" | "rejected";
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

const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#20aab6]/50 focus:ring-1 focus:ring-[#20aab6]/25 transition-colors";

const inputErrorCls =
  "w-full bg-white/[0.04] border border-red-500/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/25 transition-colors";

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

export default function KYBWizard() {
  const router = useRouter();
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

  useEffect(() => {
    if (user?.kyc_data) {
      const raw = user.kyc_data as unknown as Record<string, unknown>;
      setKyb({
        ...defaultKyb,
        ...(raw as unknown as Partial<KybState>),
        businessInfo: { ...defaultKyb.businessInfo, ...((raw.businessInfo ?? {}) as Record<string, string>) },
        documents: { ...defaultKyb.documents, ...((raw.documents ?? {}) as Record<string, unknown>) },
        directors: Array.isArray(raw.directors) ? (raw.directors as Director[]) : [],
      });
    }
  }, [user]);

  const save = useCallback(async (data: Partial<KybState>) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/kyc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kycData: data }),
      });
      const json = await res.json();
      if (json.kyc) setKyb((prev) => ({ ...prev, ...json.kyc } as KybState));
    } catch (err) {
      console.error("KYB save error:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const goTo = (step: number) => { setErrors({}); save({ step }); };
  const next = () => { setErrors({}); if (!validateStep()) return; save({ step: Math.min(kyb.step + 1, 4) }); };
  const back = () => { setErrors({}); save({ step: Math.max(kyb.step - 1, 1) }); };

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
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        setErrors((p) => ({ ...p, [field]: "JPG, PNG, or PDF only" }));
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
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return;
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
      const res = await fetch(`${API_BASE}/kyb/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kycData: kyb }),
      });
      if (res.ok) setKyb((p) => ({ ...p, status: "submitted" }));
    } catch (err) {
      console.error("KYB submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Under Review ───
  if (kyb.status === "submitted") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-[#20aab6]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Under Review</h2>
        <p className="text-white/40 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
          Your business documents are being reviewed. You&apos;ll receive an email once verification is complete.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[13px] text-white/50">Estimated review: 3–5 business days</span>
        </div>
        <div className="mt-8">
          <button onClick={() => router.push("/dashboard")} className="px-8 py-3 rounded-full text-[14px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] hover:shadow-[0_0_30px_rgba(32,170,182,0.35)] transition-shadow">
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <StepProgress steps={STEPS} currentStep={kyb.step} />

      <AnimatePresence mode="wait">
        {/* ═══════ STEP 1: Business Info ═══════ */}
        {kyb.step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Business Information</h2>
            <p className="text-white/40 text-sm mb-6">Provide your company&apos;s registered legal details.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Legal business name *" error={errors.legalBusinessName}>
                  <input className={errors.legalBusinessName ? inputErrorCls : inputCls} value={kyb.businessInfo.legalBusinessName} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, legalBusinessName: e.target.value } }))} placeholder="Acme Corp Ltd." />
                </Field>
                <Field label="Trading name *" error={errors.tradingName}>
                  <input className={errors.tradingName ? inputErrorCls : inputCls} value={kyb.businessInfo.tradingName} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, tradingName: e.target.value } }))} placeholder="Acme" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Registration number *" error={errors.registrationNumber}>
                  <input className={errors.registrationNumber ? inputErrorCls : inputCls} value={kyb.businessInfo.registrationNumber} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, registrationNumber: e.target.value } }))} placeholder="AB-12345" />
                </Field>
                <Field label="Incorporation date *" error={errors.incorporationDate}>
                  <input type="date" className={errors.incorporationDate ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyb.businessInfo.incorporationDate} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, incorporationDate: e.target.value } }))} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business type *" error={errors.businessType}>
                  <select className={errors.businessType ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyb.businessInfo.businessType} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, businessType: e.target.value } }))}>
                    <option value="" className="bg-[#0d0f1a]">Select type</option>
                    <option value="LLC" className="bg-[#0d0f1a]">LLC</option>
                    <option value="Corp" className="bg-[#0d0f1a]">Corporation</option>
                    <option value="Partnership" className="bg-[#0d0f1a]">Partnership</option>
                    <option value="Other" className="bg-[#0d0f1a]">Other</option>
                  </select>
                </Field>
                <Field label="Jurisdiction *" error={errors.jurisdiction}>
                  <select className={errors.jurisdiction ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyb.businessInfo.jurisdiction} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, jurisdiction: e.target.value } }))}>
                    <option value="" className="bg-[#0d0f1a]">Select jurisdiction</option>
                    {COUNTRIES.map((c) => { const [val, lbl] = c.split("|"); return <option key={val} value={val} className="bg-[#0d0f1a]">{lbl}</option>; })}
                  </select>
                </Field>
              </div>

              <Field label="Business address *" error={errors.businessAddress}>
                <input className={errors.businessAddress ? inputErrorCls : inputCls} value={kyb.businessInfo.businessAddress} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, businessAddress: e.target.value } }))} placeholder="123 Commerce Blvd, Port of Spain" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Website">
                  <input className={inputCls} value={kyb.businessInfo.website} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, website: e.target.value } }))} placeholder="https://example.com" />
                </Field>
                <Field label="Industry *" error={errors.industry}>
                  <select className={errors.industry ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyb.businessInfo.industry} onChange={(e) => setKyb((p) => ({ ...p, businessInfo: { ...p.businessInfo, industry: e.target.value } }))}>
                    <option value="" className="bg-[#0d0f1a]">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-[#0d0f1a]">{i}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <Nav onNext={next} saving={saving} />
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
                      <p className="text-[12px] text-white/35">{d.role}{d.ownershipPercent ? ` • ${d.ownershipPercent}% ownership` : ""}</p>
                      <p className="text-[11px] text-white/20">{d.nationality} • DOB: {d.dateOfBirth || "—"}</p>
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
                          <p className="text-[10px] text-white/15 mt-0.5">JPG, PNG or PDF • Max 20MB</p>
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

            <Nav onNext={next} onBack={back} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 3: Documents ═══════ */}
        {kyb.step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Business Documents</h2>
            <p className="text-white/40 text-sm mb-6">Upload the required documents for verification.</p>

            <div className="space-y-4">
              <DocUpload label="Certificate of Incorporation" required file={kyb.documents.certificateOfIncorporation} error={errors.certificateOfIncorporation} onFile={(f) => handleFile("certificateOfIncorporation", f)} />
              <DocUpload label="Articles of Association" required file={kyb.documents.articlesOfAssociation} error={errors.articlesOfAssociation} onFile={(f) => handleFile("articlesOfAssociation", f)} />
              <DocUpload label="Proof of Business Address" required file={kyb.documents.proofOfBusinessAddress} error={errors.proofOfBusinessAddress} onFile={(f) => handleFile("proofOfBusinessAddress", f)} />
              <DocUpload label="Shareholder Register" required={false} file={kyb.documents.shareholderRegister} error={errors.shareholderRegister} onFile={(f) => handleFile("shareholderRegister", f)} />
              <DocUpload label="Source of Funds Declaration" required={false} file={kyb.documents.sourceOfFundsDeclaration} error={errors.sourceOfFundsDeclaration} onFile={(f) => handleFile("sourceOfFundsDeclaration", f)} />
            </div>

            <Nav onNext={next} onBack={back} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 4: Review & Submit ═══════ */}
        {kyb.step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Review & Submit</h2>
            <p className="text-white/40 text-sm mb-6">Confirm everything is correct before submitting.</p>

            <div className="space-y-4">
              <ReviewSection title="Business Information" onEdit={() => goTo(1)}>
                <ReviewRow label="Legal name" value={kyb.businessInfo.legalBusinessName || "—"} />
                <ReviewRow label="Trading name" value={kyb.businessInfo.tradingName || "—"} />
                <ReviewRow label="Reg. #" value={kyb.businessInfo.registrationNumber || "—"} />
                <ReviewRow label="Incorporation" value={kyb.businessInfo.incorporationDate || "—"} />
                <ReviewRow label="Type" value={kyb.businessInfo.businessType || "—"} />
                <ReviewRow label="Jurisdiction" value={kyb.businessInfo.jurisdiction || "—"} />
                <ReviewRow label="Address" value={kyb.businessInfo.businessAddress || "—"} />
                <ReviewRow label="Website" value={kyb.businessInfo.website || "—"} />
                <ReviewRow label="Industry" value={kyb.businessInfo.industry || "—"} />
              </ReviewSection>

              <ReviewSection title={`Directors (${kyb.directors.length})`} onEdit={() => goTo(2)}>
                {kyb.directors.length === 0 ? (
                  <p className="text-[13px] text-white/30 py-2">No directors added</p>
                ) : (
                  kyb.directors.map((d, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <span className="text-[13px] text-white/35">{d.role}</span>
                      <span className="text-[13px] text-white/75">{d.fullName}{d.ownershipPercent ? ` (${d.ownershipPercent}%)` : ""}</span>
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
                By submitting, you confirm all information is accurate and documents are genuine. PSI will review your business within 3–5 business days.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={back} className="flex-1 px-6 py-3 rounded-full text-[14px] font-medium text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all">
                Back
              </button>
              <motion.button onClick={submit} disabled={submitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] transition-all disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit for Review"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════ Sub-components ═══════ */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
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
}: {
  label: string;
  required: boolean;
  file: FileInfo | null;
  error?: string;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-[13px] text-white/60">{label}</label>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${required ? "bg-red-500/10 text-red-300/70" : "bg-white/[0.04] text-white/25"}`}>
          {required ? "Required" : "Optional"}
        </span>
      </div>

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragOver ? "border-[#20aab6]/50 bg-[#20aab6]/5" : error ? "border-red-500/30" : "border-white/[0.08] hover:border-[#20aab6]/20"
          }`}
        >
          <svg className="w-6 h-6 text-white/15 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-[12px] text-white/30"><span className="text-[#20aab6]">Click to upload</span> or drag & drop</p>
          <p className="text-[10px] text-white/15 mt-0.5">JPG, PNG or PDF • Max 20MB</p>
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

function Nav({ onNext, onBack, saving }: { onNext: () => void; onBack?: () => void; saving: boolean }) {
  return (
    <div className="flex gap-3 mt-8">
      {onBack && (
        <button onClick={onBack} className="flex-1 px-6 py-3 rounded-full text-[14px] font-medium text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all">
          Back
        </button>
      )}
      <motion.button onClick={onNext} disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] transition-all disabled:opacity-50">
        {saving ? "Saving…" : "Continue"}
      </motion.button>
    </div>
  );
}
