"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";
import StepProgress from "./StepProgress";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const STEPS = [
  { number: 1, label: "Personal Info" },
  { number: 2, label: "Identity" },
  { number: 3, label: "Address" },
  { number: 4, label: "Review" },
];

interface FileInfo {
  name: string;
  size: number;
  type: string;
  preview?: string; // base64 data URL for images
}

interface KycState {
  step: number;
  status: "pending" | "submitted" | "approved" | "rejected";
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    taxId: string;
    phoneNumber: string;
  };
  identityDocs: {
    idType: string;
    front: FileInfo | null;
    back: FileInfo | null;
    passport: FileInfo | null;
  };
  addressDocs: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
    proofFile: FileInfo | null;
  };
  businessInfo: Record<string, string>;
  directors: unknown[];
  businessDocs: unknown[];
}

const defaultKyc: KycState = {
  step: 1,
  status: "pending",
  personalInfo: { firstName: "", lastName: "", dateOfBirth: "", nationality: "", taxId: "", phoneNumber: "" },
  identityDocs: { idType: "", front: null, back: null, passport: null },
  addressDocs: { streetAddress: "", city: "", stateProvince: "", postalCode: "", country: "", proofFile: null },
  businessInfo: {},
  directors: [],
  businessDocs: [],
};

const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#20aab6]/50 focus:ring-1 focus:ring-[#20aab6]/25 transition-colors";

const inputErrorCls =
  "w-full bg-white/[0.04] border border-red-500/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/25 transition-colors";

const labelCls = "block text-[13px] text-white/60 mb-1.5";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function KYCWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KycState>(defaultKyc);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.kyc_data) {
      setKyc({
        ...defaultKyc,
        ...(user.kyc_data as unknown as Partial<KycState>),
        personalInfo: { ...defaultKyc.personalInfo, ...((user.kyc_data.personalInfo ?? {}) as Record<string, string>) },
        identityDocs: { ...defaultKyc.identityDocs, ...((user.kyc_data.identityDocs as unknown ?? {}) as Record<string, unknown>) },
        addressDocs: { ...defaultKyc.addressDocs, ...((user.kyc_data.addressDocs as unknown ?? {}) as Record<string, unknown>) },
      });
    }
  }, [user]);

  const save = useCallback(async (data: Partial<KycState>) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/kyc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kycData: data }),
      });
      const json = await res.json();
      if (json.kyc) setKyc((prev) => ({ ...prev, ...json.kyc } as KycState));
    } catch (err) {
      console.error("KYC save error:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const goTo = (step: number) => {
    setErrors({});
    save({ step });
  };

  const next = () => {
    setErrors({});
    if (!validateCurrentStep()) return;
    save({ step: Math.min(kyc.step + 1, 4) });
  };

  const back = () => {
    setErrors({});
    save({ step: Math.max(kyc.step - 1, 1) });
  };

  // ─── Validation ───
  const validateCurrentStep = (): boolean => {
    const e: Record<string, string> = {};

    if (kyc.step === 1) {
      if (!kyc.personalInfo.firstName.trim()) e.firstName = "Required";
      if (!kyc.personalInfo.lastName.trim()) e.lastName = "Required";
      if (!kyc.personalInfo.dateOfBirth) e.dateOfBirth = "Required";
      if (!kyc.personalInfo.nationality) e.nationality = "Required";
      if (!kyc.personalInfo.taxId.trim()) e.taxId = "Required";
      if (!kyc.personalInfo.phoneNumber.trim()) e.phoneNumber = "Required";
    }

    if (kyc.step === 2) {
      if (!kyc.identityDocs.idType) e.idType = "Select an ID type";
      if (kyc.identityDocs.idType === "passport") {
        if (!kyc.identityDocs.passport) e.passport = "Upload your passport page";
      } else if (kyc.identityDocs.idType) {
        if (!kyc.identityDocs.front) e.front = "Upload front of ID";
        if (!kyc.identityDocs.back) e.back = "Upload back of ID";
      }
    }

    if (kyc.step === 3) {
      if (!kyc.addressDocs.streetAddress.trim()) e.streetAddress = "Required";
      if (!kyc.addressDocs.city.trim()) e.city = "Required";
      if (!kyc.addressDocs.stateProvince.trim()) e.stateProvince = "Required";
      if (!kyc.addressDocs.postalCode.trim()) e.postalCode = "Required";
      if (!kyc.addressDocs.country) e.country = "Required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── File handling ───
  const handleFile = useCallback(
    (field: "front" | "back" | "passport" | "proofFile", file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({ ...prev, [field]: "File must be under 10MB" }));
        return;
      }
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        setErrors((prev) => ({ ...prev, [field]: "Only JPG, PNG, or PDF allowed" }));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const info: FileInfo = { name: file.name, size: file.size, type: file.type, preview: reader.result as string };
        if (field === "proofFile") {
          setKyc((p) => ({ ...p, addressDocs: { ...p.addressDocs, proofFile: info } }));
        } else {
          setKyc((p) => ({ ...p, identityDocs: { ...p.identityDocs, [field]: info } }));
        }
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // ─── Submit ───
  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/kyc/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kycData: kyc }),
      });
      if (res.ok) {
        setKyc((p) => ({ ...p, status: "submitted" }));
      }
    } catch (err) {
      console.error("KYC submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Under Review screen ───
  if (kyc.status === "submitted") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-[#20aab6]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#20aab6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Under Review</h2>
        <p className="text-white/40 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
          Your identity documents are being reviewed. You&apos;ll receive an email once verification is complete.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[13px] text-white/50">Estimated review: 1–3 business days</span>
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
      <StepProgress steps={STEPS} currentStep={kyc.step} />

      <AnimatePresence mode="wait">
        {/* ═══════ STEP 1: Personal Info ═══════ */}
        {kyc.step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Personal Information</h2>
            <p className="text-white/40 text-sm mb-6">Enter your legal name and details as shown on your ID.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name *" error={errors.firstName}>
                  <input className={errors.firstName ? inputErrorCls : inputCls} value={kyc.personalInfo.firstName} onChange={(e) => setKyc((p) => ({ ...p, personalInfo: { ...p.personalInfo, firstName: e.target.value } }))} placeholder="John" />
                </Field>
                <Field label="Last name *" error={errors.lastName}>
                  <input className={errors.lastName ? inputErrorCls : inputCls} value={kyc.personalInfo.lastName} onChange={(e) => setKyc((p) => ({ ...p, personalInfo: { ...p.personalInfo, lastName: e.target.value } }))} placeholder="Doe" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of birth *" error={errors.dateOfBirth}>
                  <input type="date" className={errors.dateOfBirth ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyc.personalInfo.dateOfBirth} onChange={(e) => setKyc((p) => ({ ...p, personalInfo: { ...p.personalInfo, dateOfBirth: e.target.value } }))} />
                </Field>
                <Field label="Nationality *" error={errors.nationality}>
                  <select className={errors.nationality ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyc.personalInfo.nationality} onChange={(e) => setKyc((p) => ({ ...p, personalInfo: { ...p.personalInfo, nationality: e.target.value } }))}>
                    <option value="" className="bg-[#0d0f1a]">Select country</option>
                    {["TT|Trinidad & Tobago","JM|Jamaica","BS|Bahamas","US|United States","CA|Canada","GB|United Kingdom","GY|Guyana","BB|Barbados","SR|Suriname","OTHER|Other"].map((c) => {
                      const [val, label] = c.split("|");
                      return <option key={val} value={val} className="bg-[#0d0f1a]">{label}</option>;
                    })}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tax ID / TIN *" error={errors.taxId}>
                  <input className={errors.taxId ? inputErrorCls : inputCls} value={kyc.personalInfo.taxId} onChange={(e) => setKyc((p) => ({ ...p, personalInfo: { ...p.personalInfo, taxId: e.target.value } }))} placeholder="000-000-000" />
                </Field>
                <Field label="Phone number *" error={errors.phoneNumber}>
                  <input type="tel" className={errors.phoneNumber ? inputErrorCls : inputCls} value={kyc.personalInfo.phoneNumber} onChange={(e) => setKyc((p) => ({ ...p, personalInfo: { ...p.personalInfo, phoneNumber: e.target.value } }))} placeholder="+1 (868) 000-0000" />
                </Field>
              </div>
            </div>

            <Nav onNext={next} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 2: Identity Verification ═══════ */}
        {kyc.step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Upload a government-issued ID</h2>
            <p className="text-white/40 text-sm mb-6">Upload clear photos or scans of your identification document.</p>

            <div className="space-y-5">
              <Field label="ID type *" error={errors.idType}>
                <select className={errors.idType ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyc.identityDocs.idType} onChange={(e) => setKyc((p) => ({ ...p, identityDocs: { ...p.identityDocs, idType: e.target.value } }))}>
                  <option value="" className="bg-[#0d0f1a]">Select document type</option>
                  <option value="passport" className="bg-[#0d0f1a]">Passport</option>
                  <option value="national_id" className="bg-[#0d0f1a]">National ID</option>
                  <option value="drivers_license" className="bg-[#0d0f1a]">Driver License</option>
                </select>
              </Field>

              {kyc.identityDocs.idType === "passport" ? (
                <UploadSlot
                  label="Passport Page *"
                  file={kyc.identityDocs.passport}
                  error={errors.passport}
                  onFile={(f) => handleFile("passport", f)}
                />
              ) : kyc.identityDocs.idType ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UploadSlot
                    label="Front of ID *"
                    file={kyc.identityDocs.front}
                    error={errors.front}
                    onFile={(f) => handleFile("front", f)}
                  />
                  <UploadSlot
                    label="Back of ID *"
                    file={kyc.identityDocs.back}
                    error={errors.back}
                    onFile={(f) => handleFile("back", f)}
                  />
                </div>
              ) : null}
            </div>

            <Nav onNext={next} onBack={back} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 3: Address Verification ═══════ */}
        {kyc.step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Address Verification</h2>
            <p className="text-white/40 text-sm mb-6">Provide your residential address and upload a proof of address document.</p>

            <div className="space-y-4">
              <Field label="Street address *" error={errors.streetAddress}>
                <input className={errors.streetAddress ? inputErrorCls : inputCls} value={kyc.addressDocs.streetAddress} onChange={(e) => setKyc((p) => ({ ...p, addressDocs: { ...p.addressDocs, streetAddress: e.target.value } }))} placeholder="123 Main Street, Apt 4B" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City *" error={errors.city}>
                  <input className={errors.city ? inputErrorCls : inputCls} value={kyc.addressDocs.city} onChange={(e) => setKyc((p) => ({ ...p, addressDocs: { ...p.addressDocs, city: e.target.value } }))} placeholder="Port of Spain" />
                </Field>
                <Field label="State / Province *" error={errors.stateProvince}>
                  <input className={errors.stateProvince ? inputErrorCls : inputCls} value={kyc.addressDocs.stateProvince} onChange={(e) => setKyc((p) => ({ ...p, addressDocs: { ...p.addressDocs, stateProvince: e.target.value } }))} placeholder="San Juan/Laventille" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Postal code *" error={errors.postalCode}>
                  <input className={errors.postalCode ? inputErrorCls : inputCls} value={kyc.addressDocs.postalCode} onChange={(e) => setKyc((p) => ({ ...p, addressDocs: { ...p.addressDocs, postalCode: e.target.value } }))} placeholder="000000" />
                </Field>
                <Field label="Country *" error={errors.country}>
                  <select className={errors.country ? inputErrorCls : inputCls + " [color-scheme:dark]"} value={kyc.addressDocs.country} onChange={(e) => setKyc((p) => ({ ...p, addressDocs: { ...p.addressDocs, country: e.target.value } }))}>
                    <option value="" className="bg-[#0d0f1a]">Select country</option>
                    {["TT|Trinidad & Tobago","JM|Jamaica","BS|Bahamas","US|United States","CA|Canada","GB|United Kingdom","GY|Guyana","BB|Barbados","OTHER|Other"].map((c) => {
                      const [val, label] = c.split("|");
                      return <option key={val} value={val} className="bg-[#0d0f1a]">{label}</option>;
                    })}
                  </select>
                </Field>
              </div>

              <UploadSlot
                label="Proof of Address *"
                sublabel="Utility bill or bank statement, issued within 3 months"
                file={kyc.addressDocs.proofFile}
                error={errors.proofFile}
                onFile={(f) => handleFile("proofFile", f)}
              />
            </div>

            <Nav onNext={next} onBack={back} saving={saving} />
          </motion.div>
        )}

        {/* ═══════ STEP 4: Review & Submit ═══════ */}
        {kyc.step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-lg font-bold mb-1">Review & Submit</h2>
            <p className="text-white/40 text-sm mb-6">Confirm everything is correct before submitting.</p>

            <div className="space-y-4">
              {/* Personal Info summary */}
              <ReviewSection title="Personal Information" onEdit={() => goTo(1)}>
                <ReviewRow label="Name" value={`${kyc.personalInfo.firstName} ${kyc.personalInfo.lastName}`} />
                <ReviewRow label="Date of birth" value={kyc.personalInfo.dateOfBirth || "—"} />
                <ReviewRow label="Nationality" value={kyc.personalInfo.nationality || "—"} />
                <ReviewRow label="Tax ID" value={kyc.personalInfo.taxId || "—"} />
                <ReviewRow label="Phone" value={kyc.personalInfo.phoneNumber || "—"} />
              </ReviewSection>

              {/* Identity summary */}
              <ReviewSection title="Identity Verification" onEdit={() => goTo(2)}>
                <ReviewRow label="ID type" value={kyc.identityDocs.idType === "passport" ? "Passport" : kyc.identityDocs.idType === "national_id" ? "National ID" : kyc.identityDocs.idType === "drivers_license" ? "Driver License" : "—"} />
                {kyc.identityDocs.idType === "passport" ? (
                  <ReviewRow label="Passport Page" value={kyc.identityDocs.passport?.name || "Not uploaded"} />
                ) : (
                  <>
                    <ReviewRow label="Front" value={kyc.identityDocs.front?.name || "Not uploaded"} />
                    <ReviewRow label="Back" value={kyc.identityDocs.back?.name || "Not uploaded"} />
                  </>
                )}
              </ReviewSection>

              {/* Address summary */}
              <ReviewSection title="Address Verification" onEdit={() => goTo(3)}>
                <ReviewRow label="Street" value={kyc.addressDocs.streetAddress || "—"} />
                <ReviewRow label="City" value={kyc.addressDocs.city || "—"} />
                <ReviewRow label="State" value={kyc.addressDocs.stateProvince || "—"} />
                <ReviewRow label="Postal code" value={kyc.addressDocs.postalCode || "—"} />
                <ReviewRow label="Country" value={kyc.addressDocs.country || "—"} />
                <ReviewRow label="Proof" value={kyc.addressDocs.proofFile?.name || "Not uploaded"} />
              </ReviewSection>
            </div>

            <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-[13px] text-amber-300/80 leading-relaxed">
                By submitting, you confirm that all information is accurate and the documents are genuine. PSI will review your submission within 1–3 business days.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={back} className="flex-1 px-6 py-3 rounded-full text-[14px] font-medium text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all">
                Back
              </button>
              <motion.button
                onClick={submit}
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] transition-all disabled:opacity-50"
              >
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

function UploadSlot({
  label,
  sublabel,
  file,
  error,
  onFile,
}: {
  label: string;
  sublabel?: string;
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
      <label className={labelCls}>{label}</label>
      {sublabel && <p className="text-[11px] text-white/25 -mt-0.5 mb-1.5">{sublabel}</p>}

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragOver ? "border-[#20aab6]/50 bg-[#20aab6]/5" : error ? "border-red-500/30" : "border-white/[0.1] hover:border-[#20aab6]/20"
          }`}
        >
          <svg className="w-8 h-8 text-white/15 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-[13px] text-white/30">
            <span className="text-[#20aab6]">Click to upload</span> or drag & drop
          </p>
          <p className="text-[10px] text-white/15 mt-1">JPG, PNG or PDF • Max 10MB</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.1] rounded-xl p-3 flex items-center gap-3">
          {file.preview && file.type !== "application/pdf" ? (
            <img src={file.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/[0.1]" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-white/70 truncate">{file.name}</p>
            <p className="text-[11px] text-white/30">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={() => {
              // Clear file — pass null
              onFile(null as unknown as File);
            }}
            className="text-white/20 hover:text-red-400 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
        <button onClick={onEdit} className="text-[12px] text-[#20aab6] hover:underline font-medium">
          Edit
        </button>
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
      <motion.button
        onClick={onNext}
        disabled={saving}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[#20aab6] shadow-[0_0_20px_rgba(32,170,182,0.25)] transition-all disabled:opacity-50"
      >
        {saving ? "Saving…" : "Continue"}
      </motion.button>
    </div>
  );
}
