import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";

const router = Router();

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [usersRes, suspendedRes, pendingKycRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE role = 'individual') AS individual,
          COUNT(*) FILTER (WHERE role = 'business') AS business,
          COUNT(*) FILTER (WHERE role = 'admin') AS admin_count
        FROM users
      `),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE suspended = true`),
      pool.query(`
        SELECT COUNT(*) AS count FROM users
        WHERE kyc_data IS NOT NULL
          AND kyc_data != '{}'::jsonb
          AND kyc_data->>'status' = 'pending'
      `),
    ]);

    const row = usersRes.rows[0];
    res.json({
      users: {
        total: parseInt(row.total),
        individual: parseInt(row.individual),
        business: parseInt(row.business),
        admin: parseInt(row.admin_count),
      },
      suspended: {
        count: parseInt(suspendedRes.rows[0].count),
      },
      pendingKyc: {
        count: parseInt(pendingKycRes.rows[0].count),
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
