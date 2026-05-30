import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";

const router = Router();

// ──────────────────────────────────────────────
// POST /api/kyb/submit
// ──────────────────────────────────────────────
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { kycData } = req.body;
    if (!kycData) {
      return res.status(400).json({ error: "kycData is required" });
    }

    // Validate required business info
    const bi = kycData.businessInfo || {};
    const missing = [];
    if (!bi.legalBusinessName) missing.push("legalBusinessName");
    if (!bi.tradingName) missing.push("tradingName");
    if (!bi.registrationNumber) missing.push("registrationNumber");
    if (!bi.incorporationDate) missing.push("incorporationDate");
    if (!bi.businessType) missing.push("businessType");
    if (!bi.jurisdiction) missing.push("jurisdiction");
    if (!bi.businessAddress) missing.push("businessAddress");
    if (!bi.industry) missing.push("industry");

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    // Validate at least 1 director
    if (!Array.isArray(kycData.directors) || kycData.directors.length === 0) {
      return res.status(400).json({ error: "At least 1 director is required" });
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

    res.json({ message: "KYB submitted successfully", kyc: merged });
  } catch (err) {
    console.error("KYB submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
