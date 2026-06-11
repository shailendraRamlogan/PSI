import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../db/pool.js";
import { stripe } from "../lib/stripe.js";
import eventBus from "../events/eventBus.js";
import { sendCryptoRemittanceConfirmation } from "../lib/email.js";

const router = Router();

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function generateRefId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `PSI-CRY-${code}`;
}

// ─── POST /prepare — prepare purchase + create PaymentIntent (no DB record yet) ───
router.post("/prepare", authMiddleware, async (req, res) => {
  try {
    const { amount, network, wallet_address, wallet_label, memo } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    if (!network || !wallet_address || typeof wallet_address !== "string" || wallet_address.trim().length === 0) {
      return res.status(400).json({ error: "Network and wallet address are required" });
    }

    const numAmount = parseFloat(amount);

    // Fetch platform handling fee
    const feeResult = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'crypto_handling_fee'`
    );
    const feePercent = parseFloat(feeResult.rows[0]?.value || "0");
    const feeAmount = parseFloat((numAmount * (feePercent / 100)).toFixed(2));
    const totalAmount = parseFloat((numAmount + feeAmount).toFixed(2));

    const refId = generateRefId();

    // Create Stripe PaymentIntent
    const amountCents = Math.round(totalAmount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        ref_id: refId,
        user_id: String(req.user.id),
        amount: String(numAmount),
        fee_percent: String(feePercent),
        fee_amount: String(feeAmount),
        total: String(totalAmount),
        wallet_address: wallet_address.trim(),
        network,
        wallet_label: String(wallet_label || ""),
        memo: String(memo || ""),
      },
      description: `PSI Crypto Purchase ${refId}`,
    });

    // Audit log
    try {
      const ip = req?.ip || req?.headers?.["x-forwarded-for"] || null;
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
         VALUES ($1, 'CRYPTO_PURCHASE_PREPARED', 'crypto_purchase', 0, $2, $3::inet)`,
        [req.user.id,
         JSON.stringify({ ref_id: refId, amount: numAmount, network, wallet_address: wallet_address.trim(), stripe_payment_intent_id: paymentIntent.id }),
         ip]
      );
    } catch (err) {
      console.error("[CryptoPurchases] Audit log error:", err);
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      refId,
      amount: numAmount.toFixed(2),
      handlingFeePercent: feePercent.toFixed(2),
      handlingFeeAmount: feeAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  } catch (err) {
    console.error("[CryptoPurchases] POST /prepare error:", err);
    res.status(500).json({ error: "Failed to prepare crypto purchase" });
  }
});

// ─── GET / — list user's own purchases ───
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, ref_id, amount, handling_fee_percent, handling_fee_amount, total_amount,
              network, wallet_address, wallet_label, memo, payment_status, remittance_status, transaction_hash, stripe_payment_status, stripe_payment_intent_id, submitted_at
       FROM crypto_purchases WHERE user_id = $1 ORDER BY submitted_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(formatPurchase));
  } catch (err) {
    console.error("[CryptoPurchases] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// ─── GET /admin/all — admin list all purchases ───
router.get("/admin/all", authMiddleware, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const remittanceStatus = req.query.remittance_status;

    let where = "";
    const params = [];
    if (remittanceStatus) {
      where = "WHERE cp.remittance_status = $1";
      params.push(remittanceStatus);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM crypto_purchases cp ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const params2 = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT cp.id, cp.ref_id, cp.amount, cp.handling_fee_percent, cp.handling_fee_amount, cp.total_amount,
              cp.network, cp.wallet_address, cp.wallet_label, cp.memo, cp.payment_status, cp.remittance_status, cp.transaction_hash, cp.stripe_payment_status, cp.stripe_payment_intent_id, cp.submitted_at, cp.remitted_at,
              u.name AS user_name, u.email AS user_email,
              r.name AS remitter_name
       FROM crypto_purchases cp
       LEFT JOIN users u ON u.id = cp.user_id
       LEFT JOIN users r ON r.id = cp.remitted_by
       ${where}
       ORDER BY cp.submitted_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      params2
    );

    res.json({
      data: rows.map(formatPurchase),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[CryptoPurchases] GET /admin/all error:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// ─── GET /by-ref/:ref_id — lookup by ref_id (for frontend polling after payment) ───
router.get("/by-ref/:ref_id", authMiddleware, async (req, res) => {
  try {
    const { ref_id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, ref_id, amount, handling_fee_percent, handling_fee_amount, total_amount,
              network, wallet_address, wallet_label, memo, payment_status, remittance_status, transaction_hash, stripe_payment_status, stripe_payment_intent_id, submitted_at
       FROM crypto_purchases WHERE ref_id = $1 AND user_id = $2`,
      [ref_id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    res.json(formatPurchase(rows[0]));
  } catch (err) {
    console.error("[CryptoPurchases] GET /by-ref/:ref_id error:", err);
    res.status(500).json({ error: "Failed to fetch purchase" });
  }
});

// ─── GET /:id — single purchase ───
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, ref_id, amount, handling_fee_percent, handling_fee_amount, total_amount,
              network, wallet_address, wallet_label, memo, payment_status, remittance_status, transaction_hash, stripe_payment_status, stripe_payment_intent_id, submitted_at
       FROM crypto_purchases WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    res.json(formatPurchase(rows[0]));
  } catch (err) {
    console.error("[CryptoPurchases] GET /:id error:", err);
    res.status(500).json({ error: "Failed to fetch purchase" });
  }
});

// ─── PATCH /admin/:id/remit — mark as remitted (MUST come after /:id routes) ───
router.patch("/admin/:id/remit", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_hash } = req.body;

    if (!transaction_hash || typeof transaction_hash !== "string" || transaction_hash.trim().length === 0) {
      return res.status(400).json({ error: "Transaction hash is required" });
    }

    const { rows } = await pool.query(
      `UPDATE crypto_purchases SET remittance_status = 'remitted', remitted_at = NOW(), remitted_by = $3, transaction_hash = $2, updated_at = NOW()
       WHERE id = $1 AND remittance_status = 'pending' RETURNING *`,
      [id, transaction_hash.trim(), req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Purchase not found or already remitted" });
    }

    // Audit log
    try {
      const ip = req?.ip || req?.headers?.["x-forwarded-for"] || null;
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
         VALUES ($1, 'REMITTANCE_COMPLETED', 'crypto_purchase', $2, $3, $4::inet)`,
        [req.user.id, id,
         JSON.stringify({ ref_id: rows[0].ref_id, transaction_hash: transaction_hash.trim(), remitted_by: req.user.id, remitted_at: rows[0].remitted_at }),
         ip]
      );
    } catch (err) {
      console.error("[CryptoPurchases] Audit log error:", err);
    }

    // Send remittance confirmation email
    try {
      const purchase = rows[0];
      const userRes = await pool.query(`SELECT email, name FROM users WHERE id = $1`, [purchase.user_id]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        await sendCryptoRemittanceConfirmation({
          email: user.email,
          name: user.name || "Customer",
          refId: purchase.ref_id,
          amount: purchase.amount,
          network: purchase.network,
          walletAddress: purchase.wallet_address,
          walletLabel: purchase.wallet_label || null,
          transactionHash: transaction_hash.trim(),
        });
        console.log(`[CryptoPurchases] Remittance email sent to ${user.email} for ref ${purchase.ref_id}`);
      }
    } catch (emailErr) {
      console.error("[CryptoPurchases] Failed to send remittance email:", emailErr);
    }

    res.json(formatPurchase(rows[0]));
  } catch (err) {
    console.error("[CryptoPurchases] PATCH /admin/:id/remit error:", err);
    res.status(500).json({ error: "Failed to remit purchase" });
  }
});

// ─── Helpers ───
function formatPurchase(row) {
  return {
    id: row.id.toString(),
    refId: row.ref_id,
    amount: parseFloat(row.amount).toFixed(2),
    handlingFeePercent: parseFloat(row.handling_fee_percent).toFixed(2),
    handlingFeeAmount: parseFloat(row.handling_fee_amount).toFixed(2),
    totalAmount: parseFloat(row.total_amount).toFixed(2),
    network: row.network,
    walletAddress: row.wallet_address,
    walletLabel: row.wallet_label,
    memo: row.memo,
    paymentStatus: row.payment_status,
    remittanceStatus: row.remittance_status,
    transactionHash: row.transaction_hash || null,
    stripePaymentStatus: row.stripe_payment_status || null,
    stripePaymentIntentId: row.stripe_payment_intent_id || null,
    submittedAt: row.submitted_at,
    ...(row.user_name ? { userName: row.user_name } : {}),
    ...(row.user_email ? { userEmail: row.user_email } : {}),
    ...(row.remitter_name ? { remitterName: row.remitter_name } : {}),
    ...(row.remitted_at ? { remittedAt: row.remitted_at } : {}),
  };
}

export default router;
