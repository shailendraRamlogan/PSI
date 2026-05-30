import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads directory
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are allowed"));
    }
  },
});

const router = Router();

// ──────────────────────────────────────────────
// POST /api/kyc/submit
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// POST /api/kyc/upload
// ──────────────────────────────────────────────
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      userId: req.user.id,
    };

    res.json({
      message: "File uploaded successfully",
      file: fileInfo,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { kycData } = req.body;
    if (!kycData) {
      return res.status(400).json({ error: "kycData is required" });
    }

    // Validate required personal info
    const pi = kycData.personalInfo || {};
    const missing = [];
    if (!pi.firstName) missing.push("firstName");
    if (!pi.lastName) missing.push("lastName");
    if (!pi.dateOfBirth) missing.push("dateOfBirth");
    if (!pi.nationality) missing.push("nationality");
    if (!pi.taxId) missing.push("taxId");
    if (!pi.phoneNumber) missing.push("phoneNumber");

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    // Validate address
    const addr = kycData.addressDocs || {};
    const missingAddr = [];
    if (!addr.streetAddress) missingAddr.push("streetAddress");
    if (!addr.city) missingAddr.push("city");
    if (!addr.stateProvince) missingAddr.push("stateProvince");
    if (!addr.postalCode) missingAddr.push("postalCode");
    if (!addr.country) missingAddr.push("country");

    if (missingAddr.length > 0) {
      return res.status(400).json({ error: `Missing address fields: ${missingAddr.join(", ")}` });
    }

    // Validate ID type
    const idDocs = kycData.identityDocs || {};
    if (!idDocs.idType) {
      return res.status(400).json({ error: "ID type is required" });
    }

    // Save with submitted status
    const merged = {
      ...kycData,
      step: 4,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };

    await pool.query(
      "UPDATE users SET kyc_data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(merged), req.user.id]
    );

    res.json({ message: "KYC submitted successfully", kyc: merged });
  } catch (err) {
    console.error("KYC submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
