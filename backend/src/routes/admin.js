import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import { sendEmail } from "../lib/email.js";
import { ZipArchive } from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const router = Router();

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// GET /api/admin/kyc/queue
router.get("/queue", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, user_id, resubmitted, page = "1", limit = "20" } = req.query;
    const pg = parseInt(page);
    const lm = parseInt(limit);
    const offset = (pg - 1) * lm;

    let whereClause =
      "WHERE kyc_data IS NOT NULL AND kyc_data != '{}'::jsonb";
    const params = [];

    if (status && status !== "all") {
      whereClause += ` AND kyc_data->>'status' = $${params.length + 1}`;
      params.push(status);
    }

    // Handle frontend resubmitted filter tab
    if (resubmitted === "true") {
      whereClause += ` AND kyc_data->>'status' = $${params.length + 1}`;
      params.push("resubmitted");
    }

    if (user_id) {
      whereClause += ` AND id = $${params.length + 1}`;
      params.push(parseInt(user_id));
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    const result = await pool.query(
      `SELECT id, name, email, role, jurisdiction, kyc_data->>'status' as kyc_status, kyc_data->>'submittedAt' as submitted_at, created_at, updated_at
       FROM users ${whereClause}
       ORDER BY (kyc_data->>'submittedAt') DESC NULLS LAST, updated_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, lm, offset]
    );

    const rows = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      type: u.role === "business" ? "KYB" : "KYC",
      jurisdiction: u.jurisdiction,
      status: u.kyc_status || "pending",
      submittedAt: u.submitted_at || null,
    }));

    res.json({
      rows,
      total: parseInt(countResult.rows[0].total),
      page: pg,
      limit: lm,
    });
  } catch (err) {
    console.error("KYC queue error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/kyc/:id
router.get("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, jurisdiction, kyc_data, created_at FROM users WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const u = result.rows[0];
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      type: u.role === "business" ? "KYB" : "KYC",
      jurisdiction: u.jurisdiction,
      status: u.kyc_data?.status || "pending",
      submittedAt: u.kyc_data?.submittedAt || null,
      rejectionReason: u.kyc_data?.rejectionReason || null,
      kycData: u.kyc_data,
      flagged_fields: u.kyc_data?.flagged_fields || null,
      admin_notes: u.kyc_data?.admin_notes || null,
      resubmission_count: u.kyc_data?.resubmission_count || 0,
      previous_submission: u.kyc_data?.previous_submission || null,
    });
  } catch (err) {
    console.error("KYC detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Human-readable field name map
const FIELD_LABELS = {
  passport_front: "Passport (Front)",
  passport_back: "Passport (Back)",
  proof_of_address: "Proof of Address",
  selfie: "Identity Selfie",
  date_of_birth: "Date of Birth",
  first_name: "First Name",
  last_name: "Last Name",
  nationality: "Nationality",
  tax_id: "Tax ID / TIN",
  phone: "Phone Number",
  address_line1: "Address Line 1",
  address_line2: "Address Line 2",
  city: "City",
  state: "State / Province",
  postal_code: "Postal Code",
  country: "Country",
  company_name: "Company Name",
  legalBusinessName: "Legal Business Name",
  tradingName: "Trading Name",
  registrationNumber: "Registration Number",
  businessType: "Company Type",
  incorporationDate: "Incorporation Date",
  businessAddress: "Company Address",
  jurisdiction: "Jurisdiction",
  industry: "Industry",
  certificateOfIncorporation: "Certificate of Incorporation",
  articlesOfAssociation: "Articles of Association",
  proofOfBusinessAddress: "Proof of Business Address",
  shareholderRegister: "Shareholder Register",
  sourceOfFundsDeclaration: "Source of Funds Declaration",
  // Legacy / grouped labels
  id_front: "ID Document (Front)",
  id_back: "ID Document (Back)",
  full_name: "Full Name",
  phone_number: "Phone Number",
  street_address: "Street Address",
  state_province: "State / Province",
  identityDocs: "Identity Documents",
  personalInfo: "Personal Information",
  addressDocs: "Address Documents",
  businessInfo: "Business Information",
  directors: "Directors",
  documents: "Business Documents",
};

function fieldLabel(key) {
  return FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// POST /api/admin/kyc/:id/request-verification
router.post("/:id/request-verification", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { flagged_fields, notes } = req.body;

    // Validate flagged_fields
    if (!Array.isArray(flagged_fields) || flagged_fields.length === 0) {
      return res.status(400).json({ error: "flagged_fields must be a non-empty array" });
    }

    // Validate notes
    if (!notes || typeof notes !== "string" || notes.trim().length < 10) {
      return res.status(400).json({ error: "Notes are required (minimum 10 characters)" });
    }

    const userResult = await pool.query(
      "SELECT id, name, email, kyc_data FROM users WHERE id = $1",
      [req.params.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    const kycData = {
      ...(user.kyc_data || {}),
      status: "verification_requested",
      flagged_fields,
      admin_notes: notes.trim(),
      reviewedAt: new Date().toISOString(),
    };

    await pool.query(
      "UPDATE users SET kyc_data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(kycData), req.params.id]
    );

    // Write to audit_logs
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.params.id, "KYC_VERIFICATION_REQUESTED", "kyc_verification", req.params.id,
       JSON.stringify({ flagged_fields, notes: notes.trim() }), req.ip || null]
    );

    // Send email to user
    try {
      const firstName = (user.name || "User").split(" ")[0];
      const fieldBullets = flagged_fields
        .map((f) => `<li style="color:rgba(255,255,255,0.6);font-size:14px;padding:4px 0;">${fieldLabel(f)}</li>`)
        .join("");

      await sendEmail({
        to: user.email,
        subject: "Action Required — Please Update Your KYC Submission",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0f1a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="padding:32px 24px;text-align:center;">
      <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="160" style="display:block;margin:0 auto" />
    </td></tr>
    <tr><td style="padding:0 24px;">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
        <p style="color:rgba(255,255,255,0.9);font-size:15px;margin:0 0 8px;">Hi ${firstName},</p>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 20px;">Your identity verification submission requires some attention before we can proceed.</p>

        <h3 style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 12px;">Fields requiring your attention:</h3>
        <ul style="margin:0 0 20px;padding-left:20px;">
          ${fieldBullets}
        </ul>

        <h3 style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 12px;">Notes from our team:</h3>
        <blockquote style="margin:0 0 20px;padding:12px 16px;background:rgba(255,255,255,0.04);border-left:3px solid #20aab6;border-radius:0 8px 8px 0;">
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;line-height:1.5;">${notes.trim()}</p>
        </blockquote>

        <div style="text-align:center;margin:24px 0;">
          <a href="https://psi.ourea.tech/login" style="display:inline-block;padding:12px 32px;background:#20aab6;color:#fff;font-size:14px;font-weight:600;border-radius:999px;text-decoration:none;">Review My Submission</a>
        </div>
      </div>
    </td></tr>
    <tr><td style="padding:24px;text-align:center;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">If you have questions, contact support</p>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch (emailErr) {
      console.error("Failed to send KYC verification request email:", emailErr);
    }

    res.json({
      message: "Verification request sent",
      status: kycData.status,
      flagged_fields: kycData.flagged_fields,
      admin_notes: kycData.admin_notes,
      kycData,
    });
  } catch (err) {
    console.error("KYC verification request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/kyc/:id — approve/reject
router.patch("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }
    if (status === "rejected" && (!reason || !reason.trim())) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const userResult = await pool.query(
      "SELECT id, name, email, kyc_data FROM users WHERE id = $1",
      [req.params.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    const kycData = {
      ...(user.kyc_data || {}),
      status,
      reviewedAt: new Date().toISOString(),
    };
    if (status === "rejected") {
      kycData.rejectionReason = reason.trim();
    } else {
      delete kycData.rejectionReason;
    }

    await pool.query(
      "UPDATE users SET kyc_data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(kycData), req.params.id]
    );

    // Send email notification
    try {
      if (status === "approved") {
        await sendEmail({
          to: user.email,
          subject: "PSI — Identity Verification Approved",
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0f1a;color:#fff;border-radius:16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:48px;height:48px;border-radius:12px;background:#10b981;display:inline-flex;align-items:center;justify-content:center;font-size:24px;">✓</div>
              </div>
              <h2 style="text-align:center;font-size:20px;margin:0 0 8px;">Verification Approved</h2>
              <p style="text-align:center;color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 24px;">Hello ${user.name},</p>
              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;">
                Your identity verification has been <strong style="color:#10b981;">approved</strong>. You now have full access to all PSI payment services.
              </p>
              <a href="https://psi.ourea.tech/dashboard" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#20aab6;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">Go to Dashboard</a>
            </div>
          `,
        });
      } else {
        await sendEmail({
          to: user.email,
          subject: "PSI — Identity Verification Requires Attention",
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0f1a;color:#fff;border-radius:16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:48px;height:48px;border-radius:12px;background:#ef4444;display:inline-flex;align-items:center;justify-content:center;font-size:24px;">✗</div>
              </div>
              <h2 style="text-align:center;font-size:20px;margin:0 0 8px;">Verification Not Approved</h2>
              <p style="text-align:center;color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 24px;">Hello ${user.name},</p>
              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;">
                Your identity verification was <strong style="color:#ef4444;">not approved</strong>. Please review the reason below and re-submit.
              </p>
              <div style="margin:20px 0;padding:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;">
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.05em;">Reason</p>
                <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">${reason}</p>
              </div>
              <a href="https://psi.ourea.tech/kyc" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#20aab6;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">Re-submit KYC</a>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send KYC status email:", emailErr);
    }

    res.json({ message: `KYC ${status}`, status, kycData });
  } catch (err) {
    console.error("KYC review error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/kyc/:id/export — ZIP download
router.get("/:id/export", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, kyc_data FROM users WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const kycData = user.kyc_data || {};

    const summary = {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      kycData,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="kyc-' + user.name.replace(/\s+/g, '-') + '-' + user.id + '.zip"'
    );

    const archive = new ZipArchive();
    archive.pipe(res);

    // Add summary JSON
    archive.append(JSON.stringify(summary, null, 2), { name: "summary.json" });

    // Add human-readable customer details TXT
    const pi = kycData.personalInfo || {};
    const addr = kycData.addressDocs || {};
    const bi = kycData.businessInfo || {};
    const idDocs = kycData.identityDocs || {};
    const directors = kycData.directors || [];
    const isKYB = user.role === "business";

    const idTypeLabel = idDocs.idType === "passport" ? "Passport"
      : idDocs.idType === "national_id" ? "National ID"
      : idDocs.idType === "drivers_license" ? "Drivers License"
      : idDocs.idType || "Not provided";

    const lines = [
      "============================================",
      "       PSI — Customer Verification Details",
      "============================================",
      "",
      "Exported: " + new Date().toLocaleString(),
      "",
      "Account Type  : " + (isKYB ? "Business (KYB)" : "Individual (KYC)"),
      "Status        : " + (kycData.status || "pending"),
      "Submitted     : " + (kycData.submittedAt || "N/A"),
      "Reviewed      : " + (kycData.reviewedAt || "N/A"),
      "",
      "--- Contact ---",
      "Full Name     : " + user.name,
      "Email         : " + user.email,
      "Phone Number  : " + (pi.phoneNumber || "Not provided"),
    ];

    if (!isKYB) {
      lines.push(
        "",
        "--- Personal Information ---",
        "Date of Birth : " + (pi.dateOfBirth || "Not provided"),
        "Nationality   : " + (pi.nationality || "Not provided"),
        "Tax ID        : " + (pi.taxId || "Not provided"),
        "",
        "--- Address ---",
        "Street        : " + (addr.streetAddress || "Not provided"),
        "City          : " + (addr.city || "Not provided"),
        "State/Province: " + (addr.stateProvince || "Not provided"),
        "Postal Code   : " + (addr.postalCode || "Not provided"),
        "Country       : " + (addr.country || "Not provided"),
        "",
        "--- Identity Document ---",
        "ID Type       : " + idTypeLabel
      );
    }

    if (isKYB) {
      lines.push(
        "",
        "--- Business Information ---",
        "Legal Name           : " + (bi.legalBusinessName || "Not provided"),
        "Trading Name         : " + (bi.tradingName || "Not provided"),
        "Registration Number  : " + (bi.registrationNumber || "Not provided"),
        "Incorporation Date   : " + (bi.incorporationDate || "Not provided"),
        "Business Type        : " + (bi.businessType || "Not provided"),
        "Jurisdiction         : " + (bi.jurisdiction || "Not provided"),
        "Business Address     : " + (bi.businessAddress || "Not provided"),
        "Website              : " + (bi.website || "Not provided"),
        "Industry             : " + (bi.industry || "Not provided")
      );

      if (directors.length > 0) {
        lines.push("", "--- Directors ---");
        directors.forEach((d, i) => {
          var ownership = d.ownershipPercent
            ? d.ownershipPercent + "%"
            : "Not provided";
          lines.push(
            "",
            "Director #" + (i + 1),
            "  Name        : " + (d.fullName || "Not provided"),
            "  Role        : " + (d.role || "Not provided"),
            "  Nationality : " + (d.nationality || "Not provided"),
            "  Ownership   : " + ownership
          );
        });
      }
    }

    lines.push(
      "",
      "============================================",
      "  Documents are in the 'documents/' folder",
      "============================================"
    );

    archive.append(lines.join("\n"), { name: "customer-details.txt" });

    // Helper: add base64 data URL as file to archive
    const addBase64File = (folder, fileObj) => {
      if (!fileObj || !fileObj.name) return;
      let buffer;
      if (fileObj.preview && fileObj.preview.startsWith("data:")) {
        const base64 = fileObj.preview.split(",")[1];
        if (base64) buffer = Buffer.from(base64, "base64");
      }
      if (buffer) {
        archive.append(buffer, { name: folder + "/" + fileObj.name });
      } else {
        // Fallback: try disk file
        const filePath = path.join(UPLOAD_DIR, fileObj.storedName || fileObj.name);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: folder + "/" + fileObj.name });
        }
      }
    };

    // KYC identity docs
    if (kycData.identityDocs) {
      if (kycData.identityDocs.idType === "passport") {
        addBase64File("documents/passport-page", kycData.identityDocs.passport);
      } else {
        addBase64File("documents/identity-front", kycData.identityDocs.front);
        addBase64File("documents/identity-back", kycData.identityDocs.back);
      }
    }

    // Address proof
    if (kycData.addressDocs && kycData.addressDocs.proofFile) {
      addBase64File("documents/address-proof", kycData.addressDocs.proofFile);
    }

    // Business docs
    if (kycData.documents) {
      const docMap = {
        certificateOfIncorporation: "documents/certificate-of-incorporation",
        articlesOfAssociation: "documents/articles-of-association",
        proofOfBusinessAddress: "documents/proof-of-business-address",
        shareholderRegister: "documents/shareholder-register",
        sourceOfFundsDeclaration: "documents/source-of-funds",
      };
      for (const [key, folder] of Object.entries(docMap)) {
        addBase64File(folder, kycData.documents[key]);
      }
    }

    // Director ID files
    if (Array.isArray(kycData.directors)) {
      kycData.directors.forEach((d, i) => {
        if (d.idFile) {
          const dirName = (d.fullName || "director-" + (i + 1)).replace(/\s+/g, "-");
          addBase64File("documents/directors/" + dirName, d.idFile);
        }
      });
    }

    await archive.finalize();
  } catch (err) {
    console.error("KYC export error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Export failed" });
    }
  }
});

export default router;
