import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import { sendEmail } from "../lib/email.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads directory
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "support");
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (JPG, PNG, GIF, WebP) and PDF files are allowed"));
    }
  },
});

const router = Router();

const CATEGORY_LABELS = {
  general_inquiry: "General Inquiry",
  kyc_issue: "KYC / Identity Verification",
  payment_issue: "Payment Issue",
  crypto_purchase_issue: "Crypto Purchase Issue",
  technical_issue: "Technical Issue",
  other: "Other",
};

const DASHBOARD_URL = "https://psi.ourea.tech";

function generateRefId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PSI-TKT-${code}`;
}

function ticketCreatedEmailHtml(admin, user, ticket, category, subject, messageBody) {
  const preview = messageBody.length > 300 ? messageBody.slice(0, 300) + "..." : messageBody;
  return `<body style="margin:0;padding:0;background:#0d0f1a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="padding:32px 24px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#20aab6;">PSI Platform</div>
    </td></tr>
    <tr><td style="padding:24px;">
      <p style="color:#fff;font-size:16px;">Hi ${admin.name || "Admin"},</p>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;">A new support ticket has been opened.</p>
      <table width="100%" cellpadding="8" style="background:rgba(255,255,255,0.05);border-radius:8px;margin:16px 0;">
        <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">From</td><td style="color:#fff;font-size:14px;text-align:right;">${user.name} &lt;${user.email}&gt;</td></tr>
        <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">Ticket ID</td><td style="color:#fff;font-size:14px;text-align:right;">${ticket.ref_id}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">Category</td><td style="color:#fff;font-size:14px;text-align:right;">${category}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">Subject</td><td style="color:#fff;font-size:14px;text-align:right;">${subject}</td></tr>
      </table>
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:16px 0 4px;">Message Preview</p>
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">${preview}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://psi-panel.ourea.tech/admin/support/${ticket.id}" style="display:inline-block;background:#20aab6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Ticket</a>
      </div>
    </td></tr>
    <tr><td style="padding:24px;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;">
      PSI Platform &copy; 2025
    </td></tr>
  </table>
</body>`;
}

function newMessageEmailHtml(ticket, messagePreview, isAdmin) {
  const preview = messagePreview.length > 300 ? messagePreview.slice(0, 300) + "..." : messagePreview;
  return `<body style="margin:0;padding:0;background:#0d0f1a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="padding:32px 24px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#20aab6;">PSI Platform</div>
    </td></tr>
    <tr><td style="padding:24px;">
      <p style="color:#fff;font-size:16px;">${isAdmin ? "A user has replied to a support ticket." : "You received a new reply on your support ticket:"}</p>
      <table width="100%" cellpadding="8" style="background:rgba(255,255,255,0.05);border-radius:8px;margin:16px 0;">
        <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">Ticket ID</td><td style="color:#fff;font-size:14px;text-align:right;">${ticket.ref_id}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">Subject</td><td style="color:#fff;font-size:14px;text-align:right;">${ticket.subject}</td></tr>
      </table>
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">${preview}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${isAdmin ? `https://psi-panel.ourea.tech/admin/support/${ticket.id}` : `${DASHBOARD_URL}/dashboard/support/${ticket.id}`}" style="display:inline-block;background:#20aab6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Ticket</a>
      </div>
    </td></tr>
    <tr><td style="padding:24px;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;">
      PSI Platform &copy; 2025
    </td></tr>
  </table>
</body>`;
}

// ──────────────────────────────────────────────
// POST /tickets — Create ticket
// ──────────────────────────────────────────────
router.post("/tickets", authMiddleware, upload.array("attachments", 5), async (req, res) => {
  try {
    const { category, subject, body } = req.body;
    if (!category || !subject || !body) {
      return res.status(400).json({ error: "category, subject, and body are required" });
    }
    if (!CATEGORY_LABELS[category]) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const refId = generateRefId();
    const ticketId = crypto.randomUUID();
    const userId = req.user.id;

    const ticketRes = await pool.query(
      `INSERT INTO support_tickets (id, ref_id, user_id, category, subject)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ticketId, refId, userId, category, subject]
    );
    const ticket = ticketRes.rows[0];

    const attachments = req.files ? req.files.map(f => ({
      originalName: f.originalname,
      storedName: f.filename,
      size: f.size,
      mimeType: f.mimetype,
    })) : null;

    const msgRes = await pool.query(
      `INSERT INTO support_messages (id, ticket_id, sender_id, body, attachments)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [crypto.randomUUID(), ticketId, userId, body, attachments ? JSON.stringify(attachments) : null]
    );
    const message = msgRes.rows[0];

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, "TICKET_CREATED", "support_ticket", 0, JSON.stringify({ ref_id: refId, ticket_id: ticketId, category }), req.ip || null]
    );

    // Email to admins
    try {
      const adminRes = await pool.query("SELECT email, name FROM users WHERE role = 'admin'");
      for (const admin of adminRes.rows) {
        await sendEmail({
          to: admin.email,
          subject: `New Support Ticket — ${refId}`,
          html: ticketCreatedEmailHtml(admin, { name: req.user.name, email: req.user.email }, ticket, CATEGORY_LABELS[category] || category, subject, body),
        });
      }
    } catch (emailErr) {
      console.error("Failed to send ticket notification emails:", emailErr.message);
    }

    res.status(201).json({ ticket, message });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// GET /tickets — List user's tickets
// ──────────────────────────────────────────────
router.get("/tickets", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, m.body AS last_message, m.created_at AS last_message_at
       FROM support_tickets t
       LEFT JOIN LATERAL (
         SELECT body, created_at FROM support_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1
       ) m ON true
       WHERE t.user_id = $1
       ORDER BY t.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("List tickets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// GET /tickets/:id — Single ticket with messages
// ──────────────────────────────────────────────
router.get("/tickets/:id", authMiddleware, async (req, res) => {
  try {
    const ticketRes = await pool.query(
      "SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const ticket = ticketRes.rows[0];

    const msgRes = await pool.query(
      `SELECT m.*, u.name AS sender_name, m.is_admin_reply AS sender_type
       FROM support_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.ticket_id = $1
       ORDER BY m.created_at ASC`,
      [ticket.id]
    );

    const messages = msgRes.rows.map((m) => ({
      ...m,
      sender_type: m.sender_type ? "admin" : "user",
      attachments: m.attachments ? m.attachments.map((a) => ({
        ...a,
        file_url: `/api/uploads/support/${a.storedName}`,
        url: `/api/uploads/support/${a.storedName}`,
        filename: a.originalName,
        mime_type: a.mimeType,
      })) : [],
    }));

    res.json({ ticket, messages });
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /tickets/:id/messages — Reply to ticket
// ──────────────────────────────────────────────
router.post("/tickets/:id/messages", authMiddleware, upload.array("attachments", 5), async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ error: "body is required" });
    }

    const ticketRes = await pool.query(
      "SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const ticket = ticketRes.rows[0];

    if (ticket.status === "closed") {
      return res.status(400).json({ error: "Cannot reply to a closed ticket" });
    }

    const attachments = req.files ? req.files.map(f => ({
      originalName: f.originalname,
      storedName: f.filename,
      size: f.size,
      mimeType: f.mimetype,
    })) : null;

    const msgRes = await pool.query(
      `INSERT INTO support_messages (id, ticket_id, sender_id, body, attachments)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [crypto.randomUUID(), ticket.id, req.user.id, body, attachments ? JSON.stringify(attachments) : null]
    );
    const message = msgRes.rows[0];

    await pool.query(
      "UPDATE support_tickets SET updated_at = NOW() WHERE id = $1",
      [ticket.id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, "TICKET_MESSAGE_ADDED", "support_ticket", 0, JSON.stringify({ ref_id: ticket.ref_id, ticket_id: ticket.id }), req.ip || null]
    );

    // Email to admins
    try {
      const adminRes = await pool.query("SELECT email, name FROM users WHERE role = 'admin'");
      for (const admin of adminRes.rows) {
        await sendEmail({
          to: admin.email,
          subject: `User Reply — ${ticket.ref_id}: ${ticket.subject}`,
          html: newMessageEmailHtml(ticket, body, true),
        });
      }
    } catch (emailErr) {
      console.error("Failed to send ticket message emails:", emailErr.message);
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error("Reply to ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
