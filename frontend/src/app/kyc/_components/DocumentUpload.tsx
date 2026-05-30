"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface DocumentUploadProps {
  label: string;
  accept: string; // e.g. ".jpg,.png,.pdf"
  maxSizeMB: number;
  onUpload: (file: File, previewUrl: string) => void;
  required: boolean;
  /** Optional: pass in an existing filename to show already-uploaded state */
  initialFileName?: string;
}

export default function DocumentUpload({
  label,
  accept,
  maxSizeMB,
  onUpload,
  required,
  initialFileName,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedState | null>(
    initialFileName ? { name: initialFileName, type: "image", preview: null } : null
  );

  interface UploadedState {
    name: string;
    type: "image" | "pdf";
    preview: string | null;
  }

  const acceptList = accept.split(",").map((s) => s.trim().toLowerCase());

  const validate = useCallback(
    (file: File): string | null => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const mimeOk =
        acceptList.some(
          (a) =>
            file.type === a ||
            (a === ".jpg" && file.type === "image/jpeg") ||
            (a === ".jpeg" && file.type === "image/jpeg") ||
            (a === ".png" && file.type === "image/png") ||
            (a === ".pdf" && file.type === "application/pdf")
        ) || acceptList.includes(ext);

      if (!mimeOk) {
        return `Invalid file type. Accepted: ${accept}`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Max ${maxSizeMB}MB`;
      }
      return null;
    },
    [accept, acceptList, maxSizeMB]
  );

  const doUpload = useCallback(
    (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setUploading(true);
      setProgress(0);

      // Build preview for images
      let preview: string | null = null;
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          preview = reader.result as string;
        };
        reader.readAsDataURL(file);
      }

      // Upload via multipart/form-data with progress tracking
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploaded({
            name: file.name,
            type: isImage ? "image" : "pdf",
            preview,
          });
          onUpload(file, preview || "");
        } else {
          try {
            const json = JSON.parse(xhr.responseText);
            setError(json.error || "Upload failed");
          } catch {
            setError("Upload failed");
          }
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        setError("Network error during upload");
      });

      xhr.open("POST", `${API_BASE}/kyc/upload`);
      xhr.send(formData);
    },
    [validate, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) doUpload(e.dataTransfer.files[0]);
    },
    [doUpload]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) doUpload(e.target.files[0]);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [doUpload]
  );

  const remove = () => {
    setUploaded(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div>
      {/* Label + badge */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[13px] text-white/60">{label}</span>
        {required ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-300/70">
            Required
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/25">
            Optional
          </span>
        )}
      </div>

      {/* ─── Upload zone / Preview / Progress ─── */}
      <AnimatePresence mode="wait">
        {/* Default: empty drop zone */}
        {!uploaded && !uploading && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-[#20aab6]/60 bg-[#20aab6]/5 scale-[1.01]"
                : error
                ? "border-red-500/40"
                : "border-white/[0.1] hover:border-[#20aab6]/25 hover:bg-white/[0.01]"
            }`}
          >
            <svg
              className="w-8 h-8 text-white/[0.12] mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-[13px] text-white/30">
              <span className="text-[#20aab6]">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-[10px] text-white/15 mt-1">
              Accepted: {accept} • Max {maxSizeMB}MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleSelect}
            />
          </motion.div>
        )}

        {/* Uploading: progress bar */}
        {uploading && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-white/30 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/50">Uploading…</p>
                <p className="text-[11px] text-white/20">{progress}%</p>
              </div>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#20aab6] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}

        {/* Uploaded: preview + success */}
        {uploaded && !uploading && (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex items-center gap-3"
          >
            {/* Thumbnail or PDF icon */}
            {uploaded.type === "image" && uploaded.preview ? (
              <img
                src={uploaded.preview}
                alt=""
                className="w-11 h-11 rounded-lg object-cover border border-white/[0.08] shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-white/25"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/70 truncate">{uploaded.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {/* Green checkmark */}
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[11px] text-emerald-400/70">Uploaded</span>
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={remove}
              className="text-white/20 hover:text-red-400 transition-colors shrink-0 p-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-400 text-[11px] mt-1.5 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
