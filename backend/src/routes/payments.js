import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();

// ─── Multer config for receipt uploads (business) ───
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "src", "uploads", "payments", "receipts");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ─── Multer config for proof uploads (admin) ───
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "src", "uploads", "payments", "proofs");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ─── Generate reference ID ───
function generateRefId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `PSI-${ts}-${rand}`;
}

// ─── Helpers ───
async function appendAudit(requestId, action, performedBy, role, note, proofPath) {
  await pool.query(
    `INSERT INTO payment_audit_log (request_id, action, performed_by, role, note, proof_path, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [requestId, action, performedBy, role, note, proofPath || null]
  );
}

// ═══════════════════════════════════════════════════
// BUSINESS ROUTES
// ═══════════════════════════════════════════════════

// POST /api/payments — Create payment request
router.post("/", authMiddleware, receiptUpload.single("receipt"), async (req, res) => {
  try {
    const {
      amount,
      currency,
      beneficiary_company_name,
      beneficiary_bank_name,
      beneficiary_account_number,
      beneficiary_routing_number,
      beneficiary_bank_country,
      beneficiary_reference,
    } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    if (!beneficiary_company_name || !beneficiary_bank_name || !beneficiary_account_number) {
      return res.status(400).json({ error: "Company name, bank name, and account number are required" });
    }

    const refId = generateRefId();
    const receiptPath = req.file ? req.file.path.replace(/^.*?uploads\//, "uploads/") : null;

    // Fetch platform handling fee
    const feeResult = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'crypto_handling_fee'`
    );
    const feePercent = parseFloat(feeResult.rows[0]?.value || "0");
    const numAmount = parseFloat(amount);
    const feeAmount = parseFloat((numAmount * (feePercent / 100)).toFixed(2));

    const result = await pool.query(
      `INSERT INTO payment_requests
       (ref_id, user_id, amount, currency, beneficiary_company_name, beneficiary_bank_name,
        beneficiary_account_number, beneficiary_routing_number, beneficiary_bank_country,
        beneficiary_reference, receipt_path, status, submitted_at, handling_fee_percent, handling_fee_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW(), $12, $13)
       RETURNING id, ref_id, amount, currency, handling_fee_percent, handling_fee_amount, beneficiary_company_name, beneficiary_bank_name,
        beneficiary_account_number, beneficiary_routing_number, beneficiary_bank_country,
        beneficiary_reference, receipt_path, status, submitted_at`,
      [refId, req.user.id, numAmount, currency || "TTD",
       beneficiary_company_name, beneficiary_bank_name, beneficiary_account_number,
       beneficiary_routing_number || null, beneficiary_bank_country || null,
       beneficiary_reference || null, receiptPath, feePercent, feeAmount]
    );

    const request = result.rows[0];
    await appendAudit(request.id, "submitted", req.user.id, "business",
      `Payment of ${currency || "TTD"} ${parseFloat(amount).toFixed(2)} submitted`);

    res.status(201).json({
      id: request.id.toString(),
      refId: request.ref_id,
      amount: parseFloat(request.amount).toFixed(2),
      currency: request.currency,
      beneficiary: {
        companyName: request.beneficiary_company_name,
        bankName: request.beneficiary_bank_name,
        accountNumber: request.beneficiary_account_number,
        routingNumber: request.beneficiary_routing_number,
        bankCountry: request.beneficiary_bank_country,
        reference: request.beneficiary_reference,
      },
      receiptPreview: request.receipt_path ? `/api/payments/files/${path.basename(request.receipt_path)}` : null,
      transferProof: null,
      status: request.status,
      submittedAt: request.submitted_at,
      handlingFeePercent: parseFloat(request.handling_fee_percent || 0).toFixed(2),
      handlingFeeAmount: parseFloat(request.handling_fee_amount || 0).toFixed(2),
      receivedAt: null,
      paidAt: null,
      auditLog: [],
    });
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ error: "Failed to create payment request" });
  }
});

// GET /api/payments — List business user's payment requests (two-query approach)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const requestsResult = await pool.query(
      `SELECT id, ref_id, amount, currency, beneficiary_company_name, beneficiary_bank_name,
              beneficiary_account_number, beneficiary_routing_number, beneficiary_bank_country,
              beneficiary_reference, receipt_path, transfer_proof_path, status,
              submitted_at, received_at, paid_at,
              remittance_amount, remittance_currency,
              handling_fee_percent, handling_fee_amount
       FROM payment_requests WHERE user_id = $1 ORDER BY submitted_at DESC`,
      [req.user.id]
    );

    if (requestsResult.rows.length === 0) {
      return res.json([]);
    }

    const requestIds = requestsResult.rows.map((r) => r.id);

    const auditResult = await pool.query(
      `SELECT al.request_id, al.action, al.performed_by, al.role, al.created_at, al.note, al.proof_path,
              u.name as performer_name
       FROM payment_audit_log al
       JOIN users u ON u.id = al.performed_by
       WHERE al.request_id = ANY($1)
       ORDER BY al.created_at ASC`,
      [requestIds]
    );

    // Map audit entries to requests
    const auditMap = {};
    for (const entry of auditResult.rows) {
      if (!auditMap[entry.request_id]) auditMap[entry.request_id] = [];
      auditMap[entry.request_id].push({
        action: entry.action,
        performedBy: entry.performer_name,
        role: entry.role,
        timestamp: entry.created_at,
        note: entry.note,
        proofImageUrl: entry.proof_path ? `/api/payments/files/${path.basename(entry.proof_path)}` : null,
      });
    }

    const requests = requestsResult.rows.map((r) => ({
      id: r.id.toString(),
      refId: r.ref_id,
      amount: parseFloat(r.amount).toFixed(2),
      currency: r.currency,
      beneficiary: {
        companyName: r.beneficiary_company_name,
        bankName: r.beneficiary_bank_name,
        accountNumber: r.beneficiary_account_number,
        routingNumber: r.beneficiary_routing_number,
        bankCountry: r.beneficiary_bank_country,
        reference: r.beneficiary_reference,
      },
      receiptPreview: r.receipt_path ? `/api/payments/files/${path.basename(r.receipt_path)}` : null,
      transferProof: r.transfer_proof_path ? `/api/payments/files/${path.basename(r.transfer_proof_path)}` : null,
      status: r.status,
      submittedAt: r.submitted_at,
      receivedAt: r.received_at,
      paidAt: r.paid_at,
      remittanceAmount: r.remittance_amount ? parseFloat(r.remittance_amount).toFixed(2) : null,
      remittanceCurrency: r.remittance_currency || null,
      handlingFeePercent: parseFloat(r.handling_fee_percent || 0).toFixed(2),
      handlingFeeAmount: parseFloat(r.handling_fee_amount || 0).toFixed(2),
      auditLog: auditMap[r.id] || [],
    }));

    res.json(requests);
  } catch (err) {
    console.error("List payments error:", err);
    res.status(500).json({ error: "Failed to fetch payment requests" });
  }
});

// ═══════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// GET /api/payments/admin/all — List all payment requests (two-query approach)
router.get("/admin/all", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const pg = parseInt(page);
    const lm = parseInt(limit);
    const offset = (pg - 1) * lm;

    let whereClause = "WHERE 1=1";
    const params = [];
    if (status) {
      params.push(status);
      whereClause += ` AND pr.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payment_requests pr ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT pr.id, pr.ref_id, pr.amount, pr.currency,
              pr.beneficiary_company_name, pr.beneficiary_bank_name,
              pr.beneficiary_account_number, pr.beneficiary_routing_number,
              pr.beneficiary_bank_country, pr.beneficiary_reference,
              pr.receipt_path, pr.transfer_proof_path, pr.status,
              pr.submitted_at, pr.received_at, pr.paid_at,
              pr.received_by, pr.paid_by,
              pr.remittance_amount, pr.remittance_currency,
              pr.handling_fee_percent, pr.handling_fee_amount,
              u.name as business_name, u.email as business_email
       FROM payment_requests pr
       JOIN users u ON u.id = pr.user_id
       ${whereClause}
       ORDER BY pr.submitted_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, lm, offset]
    );

    if (result.rows.length === 0) {
      return res.json({ requests: [], total, page: pg, limit: lm });
    }

    const requestIds = result.rows.map((r) => r.id);

    const auditResult = await pool.query(
      `SELECT al.request_id, al.action, al.performed_by, al.role, al.created_at, al.note, al.proof_path,
              au.name as performer_name
       FROM payment_audit_log al
       JOIN users au ON au.id = al.performed_by
       WHERE al.request_id = ANY($1)
       ORDER BY al.created_at ASC`,
      [requestIds]
    );

    // Map audit entries to requests
    const auditMap = {};
    for (const entry of auditResult.rows) {
      if (!auditMap[entry.request_id]) auditMap[entry.request_id] = [];
      auditMap[entry.request_id].push({
        action: entry.action,
        performedBy: entry.performer_name,
        role: entry.role,
        timestamp: entry.created_at,
        note: entry.note,
        proofImageUrl: entry.proof_path ? `/api/payments/files/${path.basename(entry.proof_path)}` : null,
      });
    }

    const requests = result.rows.map((r) => ({
      id: r.id.toString(),
      refId: r.ref_id,
      businessName: r.business_name,
      businessEmail: r.business_email,
      amount: parseFloat(r.amount).toFixed(2),
      currency: r.currency,
      beneficiary: {
        companyName: r.beneficiary_company_name,
        bankName: r.beneficiary_bank_name,
        accountNumber: r.beneficiary_account_number,
        routingNumber: r.beneficiary_routing_number,
        bankCountry: r.beneficiary_bank_country,
        reference: r.beneficiary_reference,
      },
      receiptPreview: r.receipt_path ? `/api/payments/files/${path.basename(r.receipt_path)}` : null,
      transferProof: r.transfer_proof_path ? `/api/payments/files/${path.basename(r.transfer_proof_path)}` : null,
      status: r.status,
      submittedAt: r.submitted_at,
      receivedAt: r.received_at,
      paidAt: r.paid_at,
      receivedBy: r.received_by ? r.received_by.toString() : null,
      paidBy: r.paid_by ? r.paid_by.toString() : null,
      remittanceAmount: r.remittance_amount ? parseFloat(r.remittance_amount).toFixed(2) : null,
      remittanceCurrency: r.remittance_currency || null,
      handlingFeePercent: parseFloat(r.handling_fee_percent || 0).toFixed(2),
      handlingFeeAmount: parseFloat(r.handling_fee_amount || 0).toFixed(2),
      auditLog: auditMap[r.id] || [],
    }));

    res.json({ requests, total, page: pg, limit: lm });
  } catch (err) {
    console.error("Admin list payments error:", err);
    res.status(500).json({ error: "Failed to fetch payment requests" });
  }
});

// PATCH /api/payments/admin/:id/receive — Mark as received
router.patch("/admin/:id/receive", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE payment_requests
       SET status = 'received', received_at = NOW(), received_by = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment request not found or not pending" });
    }

    await appendAudit(id, "marked_received", req.user.id, "admin", "Funds received in PSI account");

    res.json({ success: true, status: "received" });
  } catch (err) {
    console.error("Mark received error:", err);
    res.status(500).json({ error: "Failed to update payment request" });
  }
});

// PATCH /api/payments/admin/:id/pay — Mark as paid + upload proof
router.patch("/admin/:id/pay", authMiddleware, adminOnly, proofUpload.single("proof"), async (req, res) => {
  try {
    const { id } = req.params;
    const { remittance_amount, remittance_currency } = req.body;

    // Validate remittance fields
    if (!remittance_amount || parseFloat(remittance_amount) <= 0) {
      return res.status(400).json({ error: "Valid remittance amount is required" });
    }
    if (!remittance_currency || !['USD', 'TTD', 'JMD', 'BSD'].includes(remittance_currency)) {
      return res.status(400).json({ error: "Valid remittance currency is required" });
    }

    const proofPath = req.file ? req.file.path.replace(/^.*?uploads\//, "uploads/") : null;

    const result = await pool.query(
      `UPDATE payment_requests
       SET status = 'paid', paid_at = NOW(), paid_by = $1, updated_at = NOW(),
           transfer_proof_path = COALESCE($3, transfer_proof_path),
           remittance_amount = $4, remittance_currency = $5
       WHERE id = $2 AND status = 'received'
       RETURNING *`,
      [req.user.id, id, proofPath, parseFloat(remittance_amount), remittance_currency]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment request not found or not in received status" });
    }

    const request = result.rows[0];
    await appendAudit(id, "marked_paid", req.user.id, "admin",
      `Remitted ${remittance_currency} ${parseFloat(remittance_amount).toFixed(2)} to ${request.beneficiary_company_name}`,
      proofPath);

    res.json({ success: true, status: "paid" });
  } catch (err) {
    console.error("Mark paid error:", err);
    res.status(500).json({ error: "Failed to update payment request" });
  }
});

// ═══════════════════════════════════════════════════
// FILE SERVING
// ═══════════════════════════════════════════════════

// GET /api/payments/files/:filename — Serve uploaded files
router.get("/files/:filename", authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    // Security: only allow alphanumeric, dash, underscore, dot
    if (!/^[\w.-]+$/.test(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    // Search in receipts and proofs directories
    const receiptDir = path.join(process.cwd(), "src", "uploads", "payments", "receipts", filename);
    const proofDir = path.join(process.cwd(), "src", "uploads", "payments", "proofs", filename);

    const filePath = fs.existsSync(receiptDir) ? receiptDir : fs.existsSync(proofDir) ? proofDir : null;

    if (!filePath) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error("File serve error:", err);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;
