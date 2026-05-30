import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import eventBus from "../events/eventBus.js";

const router = Router();

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

/** Write an audit log entry */
async function auditLog(adminId, action, entity, entityId, metadata, req) {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || null;
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::inet)`,
      [adminId, action, entity, entityId, JSON.stringify(metadata || {}), ip]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// ──────────────────────────────────────────────
// GET /api/admin/users — search/list users
// ──────────────────────────────────────────────
// Query params: page, limit, search, role, jurisdiction, status, kyc_status
// All filters optional and combinable. Role filtering is open-ended (no whitelist)
// so Phase 4 roles (e.g. tokenization_investor) pass through automatically.
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search, role, jurisdiction, status, kyc_status, page = "1", limit = "20" } = req.query;
    const pg = Math.max(1, parseInt(page) || 1);
    const pgLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pg - 1) * pgLimit;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    // Collect applied filters for audit metadata
    const appliedFilters = {};

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      appliedFilters.search = search;
      paramIdx++;
    }
    if (role && role !== "all") {
      // Open-ended: no whitelist — Phase 4 roles pass through
      conditions.push(`u.role = $${paramIdx}`);
      params.push(role);
      appliedFilters.role = role;
      paramIdx++;
    }
    if (jurisdiction && jurisdiction !== "all") {
      conditions.push(`u.jurisdiction = $${paramIdx}`);
      params.push(jurisdiction);
      appliedFilters.jurisdiction = jurisdiction;
      paramIdx++;
    }
    if (status === "active") {
      conditions.push(`u.suspended = false`);
      appliedFilters.status = "active";
    } else if (status === "suspended") {
      conditions.push(`u.suspended = true`);
      appliedFilters.status = "suspended";
    }
    if (kyc_status) {
      conditions.push(`COALESCE(kv.status, u.kyc_data->>'status') = $${paramIdx}`);
      params.push(kyc_status);
      appliedFilters.kyc_status = kyc_status;
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total
       FROM users u
       LEFT JOIN LATERAL (
         SELECT status FROM kyc_verifications
         WHERE user_id = u.id ORDER BY updated_at DESC LIMIT 1
       ) kv ON true
       ${where}`,
      params
    );

    // Data query with LEFT JOINs for profile, KYC, wallet count, transaction count
    // wallet_count and transaction_count use subqueries on tables that may not exist yet
    // (Phase 2). The subqueries return 0 when the tables don't exist.
    const dataRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              CASE WHEN u.suspended THEN 'suspended' ELSE 'active' END as status,
              u.jurisdiction, u.created_at,
              p.phone,
              p.first_name, p.last_name,
              COALESCE(kv.status, u.kyc_data->>'status') as kyc_status,
              COALESCE(kv.current_step, (u.kyc_data->>'step')::int, 1) as kyc_step,
              COALESCE(wc.cnt, 0)::int as wallet_count,
              COALESCE(tc.cnt, 0)::int as transaction_count
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT status, current_step FROM kyc_verifications
         WHERE user_id = u.id ORDER BY updated_at DESC LIMIT 1
       ) kv ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) as cnt FROM wallets WHERE user_id = u.id
       ) wc ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) as cnt FROM transactions WHERE user_id = u.id
       ) tc ON true
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, pgLimit, offset]
    );

    // Shape response to nested objects
    const rows = dataRes.rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      status: r.status,
      jurisdiction: r.jurisdiction,
      created_at: r.created_at,
      profile: {
        first_name: r.first_name || r.name?.split(" ")[0] || null,
        last_name: r.last_name || r.name?.split(" ").slice(1).join(" ") || null,
        phone: r.phone || null,
      },
      kyc: {
        status: r.kyc_status || "pending",
        current_step: r.kyc_step || 1,
      },
      wallet_count: r.wallet_count,
      transaction_count: r.transaction_count,
    }));

    // Audit log the search action (fire-and-forget)
    auditLog(req.user.id, "ADMIN_USER_SEARCH", "user", 0, { filters: appliedFilters }, req);

    res.json({
      rows,
      total: countRes.rows[0].total,
      page: pg,
      limit: pgLimit,
    });
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ──────────────────────────────────────────────
// GET /api/admin/users/:id — full user detail
// ──────────────────────────────────────────────
router.get("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.jurisdiction, u.email_verified,
              u.suspended, u.suspended_at, u.suspended_reason,
              u.kyc_data, u.created_at, u.updated_at,
              p.phone, p.date_of_birth, p.nationality, p.tax_id
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];

    // If no profile row yet, extract from kyc_data JSONB
    if (!user.phone && !user.date_of_birth) {
      const pi = user.kyc_data?.personalInfo || {};
      user.phone = pi.phoneNumber || null;
      user.date_of_birth = pi.dateOfBirth || null;
      user.nationality = pi.nationality || null;
      user.tax_id = pi.taxId || null;
    }

    // KYC/KYB verification records
    const kycRes = await pool.query(
      `SELECT id, type, status, current_step as step, submitted_at, reviewed_at,
              reviewer_id, rejection_reason
       FROM kyc_verifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // KYC documents
    const docsRes = await pool.query(
      `SELECT d.id, d.doc_type, d.doc_label, d.filename, d.mime_type, d.file_size, d.status, d.created_at
       FROM kyc_documents d WHERE d.user_id = $1 ORDER BY d.created_at DESC`,
      [userId]
    );

    res.json({
      user,
      kyc_verifications: kycRes.rows,
      documents: docsRes.rows,
    });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/admin/users/:id/suspend — toggle suspension
// ──────────────────────────────────────────────
router.patch("/:id/suspend", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { suspend, reason } = req.body;

    if (typeof suspend !== "boolean") {
      return res.status(400).json({ error: "suspend must be a boolean" });
    }
    if (req.user.id === userId) {
      return res.status(403).json({ error: "Cannot suspend yourself" });
    }

    // Reason is required when suspending (min 10 chars)
    if (suspend && (!reason || reason.trim().length < 10)) {
      return res.status(400).json({ error: "Reason is required (minimum 10 characters)" });
    }

    const result = await pool.query(
      `UPDATE users
       SET suspended = $1,
           suspended_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           suspended_reason = CASE WHEN $1 THEN $2 ELSE NULL END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, suspended, suspended_at, suspended_reason`,
      [suspend, suspend ? reason.trim() : null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Revoke all refresh tokens for suspended users
    if (suspend) {
      await pool.query(
        "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false",
        [userId]
      );
    }

    const action = suspend ? "USER_SUSPENDED" : "USER_REACTIVATED";
    const ip = req.ip || req.headers["x-forwarded-for"] || null;

    await auditLog(
      req.user.id, action, "user", userId,
      { reason: suspend ? reason.trim() : null, previous_status: suspend ? "active" : "suspended", target_name: result.rows[0].name },
      req
    );

    // Emit to internal event bus (Phase 2+ subscribers)
    eventBus.emitSafe(action, {
      userId,
      adminId: req.user.id,
      reason: suspend ? reason.trim() : null,
      ip,
      timestamp: new Date().toISOString(),
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Admin suspend error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/admin/users/:id/role — change role (individual ↔ business only)
// ──────────────────────────────────────────────
router.patch("/:id/role", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || !["individual", "business"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'individual' or 'business'" });
    }
    if (req.user.id === userId) {
      return res.status(403).json({ error: "Cannot change your own role" });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2 AND role != 'admin'
       RETURNING id, name, email, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found or cannot change admin role" });
    }

    await auditLog(
      req.user.id,
      "user.role_change",
      "user", userId,
      { new_role: role, target_name: result.rows[0].name },
      req
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Admin role change error:", err);
    res.status(500).json({ error: "Failed to change role" });
  }
});

export default router;
