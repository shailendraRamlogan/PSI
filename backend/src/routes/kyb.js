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

// ──────────────────────────────────────────────
// POST /api/kyb/resubmit
// ──────────────────────────────────────────────
router.post("/resubmit", authMiddleware, async (req, res) => {
  try {
    const { kycData } = req.body;
    if (!kycData) {
      return res.status(400).json({ error: "kycData is required" });
    }

    console.log("[KYB RESUBMIT] user:", req.user.id, "incoming kycData.businessInfo.registrationNumber:", kycData.businessInfo?.registrationNumber);
    console.log("[KYB RESUBMIT] incoming kycData.businessInfo.businessType:", kycData.businessInfo?.businessType);
    console.log("[KYB RESUBMIT] full incoming kycData keys:", Object.keys(kycData));

    const userResult = await pool.query(
      "SELECT id, name, email, kyc_data FROM users WHERE id = $1",
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    const currentKycData = user.kyc_data || {};

    if (currentKycData.status !== "verification_requested") {
      return res.status(400).json({
        error: `Cannot resubmit — current status is '${currentKycData.status || "pending"}'. Resubmission is only allowed when status is 'verification_requested'.`,
      });
    }

    // Snapshot current submission data into previous_submission
    const previousSubmission = { ...currentKycData };
    delete previousSubmission.previous_submission;

    const resubmissionCount = (currentKycData.resubmission_count || 0) + 1;

    const updatedKycData = {
      ...kycData,
      status: "resubmitted",
      submittedAt: new Date().toISOString(),
      previous_submission: previousSubmission,
      resubmission_count: resubmissionCount,
      flagged_fields: null,
      admin_notes: null,
    };

    await pool.query(
      "UPDATE users SET kyc_data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(updatedKycData), req.user.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, "KYC_RESUBMITTED", "kyc_verification", req.user.id,
       JSON.stringify({ resubmission_count: resubmissionCount }), req.ip || null]
    );

    res.json({
      message: "KYB resubmitted successfully",
      status: updatedKycData.status,
      resubmission_count: resubmissionCount,
      kycData: updatedKycData,
    });
  } catch (err) {
    console.error("KYB resubmit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
