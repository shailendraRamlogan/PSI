import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import eventBus from "../events/eventBus.js";

const router = Router();

// ── Admin-only middleware (same pattern as admin.js) ──
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ──────────────────────────────────────────────
// GET /api/settings/crypto-fee — public, no auth
// ──────────────────────────────────────────────
router.get("/crypto-fee", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'crypto_handling_fee'`
    );
    if (rows.length === 0) {
      return res.json({ fee: "0.00" });
    }
    res.json({ fee: rows[0].value });
  } catch (err) {
    console.error("[Settings] GET public crypto-fee error:", err);
    res.status(500).json({ error: "Failed to fetch fee" });
  }
});

// ──────────────────────────────────────────────
// GET /api/admin/settings/crypto-fee — admin only
// ──────────────────────────────────────────────
router.get("/crypto-fee", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ps.value, ps.updated_at, u.name AS updated_by_name
       FROM platform_settings ps
       LEFT JOIN users u ON ps.updated_by = u.id
       WHERE ps.key = 'crypto_handling_fee'`
    );
    if (rows.length === 0) {
      return res.json({ fee: "0.00", updated_at: null, updated_by_name: null });
    }
    res.json({
      fee: rows[0].value,
      updated_at: rows[0].updated_at,
      updated_by_name: rows[0].updated_by_name,
    });
  } catch (err) {
    console.error("[Settings] GET admin crypto-fee error:", err);
    res.status(500).json({ error: "Failed to fetch fee" });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/admin/settings/crypto-fee — admin only
// ──────────────────────────────────────────────
router.patch("/crypto-fee", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { fee } = req.body;

    if (fee === undefined || fee === null || typeof fee !== "number") {
      return res.status(400).json({ error: "Fee must be a number" });
    }
    if (fee < 0 || fee > 100) {
      return res.status(400).json({ error: "Fee must be between 0 and 100" });
    }

    const feeStr = fee.toFixed(2);

    // Get previous value for audit
    const prev = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'crypto_handling_fee'`
    );
    const previousFee = prev.rows[0]?.value || "0.00";

    // Update
    const { rows } = await pool.query(
      `UPDATE platform_settings
       SET value = $1, updated_at = NOW(), updated_by = $2
       WHERE key = 'crypto_handling_fee'
       RETURNING value, updated_at`,
      [feeStr, req.user.id]
    );

    // Audit log
    try {
      const ip = req.ip || req.headers["x-forwarded-for"] || null;
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, 0, $4, $5::inet)`,
        [
          req.user.id,
          "FEE_UPDATED",
          "platform_settings",
          JSON.stringify({ previous_fee: previousFee, new_fee: feeStr }),
          ip,
        ]
      );
    } catch (auditErr) {
      console.error("[Settings] Audit log error:", auditErr);
    }

    // Emit event for future phases
    eventBus.emit("FEE_UPDATED", {
      key: "crypto_handling_fee",
      value: feeStr,
      adminId: req.user.id,
    });

    res.json({
      fee: rows[0].value,
      updated_at: rows[0].updated_at,
      updated_by_name: req.user.name || req.user.email,
    });
  } catch (err) {
    console.error("[Settings] PATCH crypto-fee error:", err);
    res.status(500).json({ error: "Failed to update fee" });
  }
});

// ──────────────────────────────────────────────
// GET /api/admin/settings/crypto-fee/history — admin only
// ──────────────────────────────────────────────
router.get("/crypto-fee/history", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT al.metadata, al.created_at, u.name AS admin_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.action = 'FEE_UPDATED'
       ORDER BY al.created_at DESC
       LIMIT 20`
    );

    const history = rows.map((row) => ({
      previous_fee: row.metadata?.previous_fee || null,
      new_fee: row.metadata?.new_fee || null,
      admin_name: row.admin_name,
      timestamp: row.created_at,
    }));

    res.json({ history });
  } catch (err) {
    console.error("[Settings] GET crypto-fee history error:", err);
    res.status(500).json({ error: "Failed to fetch fee history" });
  }
});

export default router;
