import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";

const router = Router();

const ALLOWED_NETWORKS = [
  "Bitcoin", "Ethereum", "BNB Chain", "Tron",
  "Solana", "Polygon", "Avalanche", "Arbitrum", "Optimism", "Base",
];

/** Write an audit log entry. entity_id must be integer; we store UUID in metadata. */
async function auditLog(userId, action, entity, entityId, metadata, req) {
  try {
    const ip = req?.ip || req?.headers?.["x-forwarded-for"] || null;
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, NULL, $4, $5::inet)`,
      [userId, action, entity, JSON.stringify(metadata || {}), ip]
    );
  } catch (err) {
    console.error("[Wallets] Audit log error:", err);
  }
}

// ── Address validation (Solana = warning-only on frontend, accepted here) ──
const WALLET_VALIDATORS = {
  Bitcoin: /^(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  Ethereum: /^0x[a-fA-F0-9]{40}$/,
  "BNB Chain": /^0x[a-fA-F0-9]{40}$/,
  Tron: /^T[a-zA-Z0-9]{33}$/,
  // Solana intentionally omitted — warning only on frontend
  Polygon: /^0x[a-fA-F0-9]{40}$/,
  Avalanche: /^0x[a-fA-F0-9]{40}$/,
  Arbitrum: /^0x[a-fA-F0-9]{40}$/,
  Optimism: /^0x[a-fA-F0-9]{40}$/,
  Base: /^0x[a-fA-F0-9]{40}$/,
};

function validateWalletAddress(network, address) {
  const regex = WALLET_VALIDATORS[network];
  if (!regex) return null; // Solana or unknown — skip
  return regex.test(address.trim());
}

// ──────────────────────────────────────────────
// GET /api/wallets — list all wallets for user
// ──────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, label, wallet_address, network, memo, created_at, updated_at
       FROM saved_wallets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ wallets: rows });
  } catch (err) {
    console.error("[Wallets] GET error:", err);
    res.status(500).json({ error: "Failed to fetch wallets" });
  }
});

// ──────────────────────────────────────────────
// POST /api/wallets — save a new wallet
// ──────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { label, wallet_address, network, memo } = req.body;

    // Validation
    if (!label || typeof label !== "string" || label.trim().length === 0) {
      return res.status(400).json({ error: "Label is required" });
    }
    if (!wallet_address || typeof wallet_address !== "string" || wallet_address.trim().length === 0) {
      return res.status(400).json({ error: "Wallet address is required" });
    }
    if (!network || !ALLOWED_NETWORKS.includes(network)) {
      return res.status(400).json({
        error: "Invalid network. Allowed: " + ALLOWED_NETWORKS.join(", "),
      });
    }

    const validAddr = validateWalletAddress(network, wallet_address);
    if (validAddr === false) {
      return res.status(400).json({ error: `Invalid wallet address format for ${network}` });
    }

    const { rows } = await pool.query(
      `INSERT INTO saved_wallets (user_id, label, wallet_address, network, memo)
       VALUES ($1, $2, $3, $4::wallet_network, $5)
       RETURNING id, label, wallet_address, network, memo, created_at, updated_at`,
      [req.user.id, label.trim(), wallet_address.trim(), network, memo?.trim() || null]
    );

    const wallet = rows[0];

    // Audit
    await auditLog(
      req.user.id,
      "WALLET_ADDED",
      "wallet",
      wallet.id,
      { label: wallet.label, network: wallet.network, address: wallet.wallet_address },
      req
    );

    res.status(201).json({ wallet });
  } catch (err) {
    console.error("[Wallets] POST error:", err);
    res.status(500).json({ error: "Failed to save wallet" });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/wallets/:id — update a wallet
// ──────────────────────────────────────────────
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, wallet_address, network, memo } = req.body;

    // Verify ownership
    const existing = await pool.query(
      `SELECT id, network FROM saved_wallets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Build dynamic SET clause
    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (label !== undefined) {
      if (typeof label !== "string" || label.trim().length === 0) {
        return res.status(400).json({ error: "Label is required" });
      }
      fields.push(`label = $${paramIdx++}`);
      values.push(label.trim());
    }
    if (wallet_address !== undefined) {
      if (typeof wallet_address !== "string" || wallet_address.trim().length === 0) {
        return res.status(400).json({ error: "Wallet address is required" });
      }
      fields.push(`wallet_address = $${paramIdx++}`);
      values.push(wallet_address.trim());
    }
    if (network !== undefined) {
      if (!ALLOWED_NETWORKS.includes(network)) {
        return res.status(400).json({
          error: "Invalid network. Allowed: " + ALLOWED_NETWORKS.join(", "),
        });
      }
      fields.push(`network = $${paramIdx++}::wallet_network`);
      values.push(network);
    }

    // Validate address format (use new network if provided, otherwise fetch existing)
    if (wallet_address !== undefined) {
      const effectiveNetwork = network || existing.rows[0].network;
      const validAddr = validateWalletAddress(effectiveNetwork, wallet_address);
      if (validAddr === false) {
        return res.status(400).json({ error: `Invalid wallet address format for ${effectiveNetwork}` });
      }
    }
    if (memo !== undefined) {
      fields.push(`memo = $${paramIdx++}`);
      values.push(memo?.trim() || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = NOW()`);

    values.push(id, req.user.id);
    const sql = `UPDATE saved_wallets SET ${fields.join(", ")}
                 WHERE id = $${paramIdx++} AND user_id = $${paramIdx}
                 RETURNING id, label, wallet_address, network, memo, created_at, updated_at`;

    const { rows } = await pool.query(sql, values);
    res.json({ wallet: rows[0] });
  } catch (err) {
    console.error("[Wallets] PATCH error:", err);
    res.status(500).json({ error: "Failed to update wallet" });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/wallets/:id — delete a wallet
// ──────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership and get label for audit
    const existing = await pool.query(
      `SELECT id, label, network FROM saved_wallets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const wallet = existing.rows[0];

    await pool.query(
      `DELETE FROM saved_wallets WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    // Audit
    await auditLog(
      req.user.id,
      "WALLET_DELETED",
      "wallet",
      wallet.id,
      { label: wallet.label, network: wallet.network },
      req
    );

    res.json({ deleted: true });
  } catch (err) {
    console.error("[Wallets] DELETE error:", err);
    res.status(500).json({ error: "Failed to delete wallet" });
  }
});

export default router;
