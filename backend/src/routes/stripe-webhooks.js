import { stripe } from "../lib/stripe.js";
import pool from "../db/pool.js";
import eventBus from "../events/eventBus.js";

export async function stripeWebhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const intentId = paymentIntent.id;
        const amount = paymentIntent.amount;
        const meta = paymentIntent.metadata || {};
        const refId = meta.ref_id;

        if (!refId) {
          console.warn(`[Stripe Webhook] No ref_id in metadata for payment intent ${intentId}`);
          break;
        }

        // Idempotency check — record may already exist
        const existing = await pool.query(
          `SELECT id FROM crypto_purchases WHERE ref_id = $1`,
          [refId]
        );

        if (existing.rows.length > 0) {
          console.log(`[Stripe Webhook] Record already exists for ref ${refId} — skipping insert`);
          break;
        }

        // Create the crypto_purchases record from payment intent metadata
        const userId = parseInt(meta.user_id) || null;
        const numAmount = parseFloat(meta.amount) || 0;
        const feePercent = parseFloat(meta.fee_percent) || 0;
        const feeAmount = parseFloat(meta.fee_amount) || 0;
        const totalAmount = parseFloat(meta.total) || 0;
        const walletAddress = meta.wallet_address || "";
        const network = meta.network || "";
        const walletLabel = meta.wallet_label || null;
        const memo = meta.memo || null;

        const { rows } = await pool.query(
          `INSERT INTO crypto_purchases
            (ref_id, user_id, amount, handling_fee_percent, handling_fee_amount, total_amount,
             network, wallet_address, wallet_label, memo, status, payment_status, remittance_status,
             stripe_payment_intent_id, stripe_payment_status, submitted_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', 'succeeded', 'pending',
                   $11, 'succeeded', NOW())
           RETURNING id`,
          [refId, userId, numAmount, feePercent, feeAmount, totalAmount,
           network, walletAddress, walletLabel || null, memo || null,
           intentId]
        );

        const purchaseId = rows[0].id;

        // Audit log
        try {
          await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address)
             VALUES ($1, 'CRYPTO_PURCHASE_CONFIRMED', 'crypto_purchase', $2, $3, NULL)`,
            [userId, purchaseId,
             JSON.stringify({ ref_id: refId, stripe_payment_intent_id: intentId, amount: (amount / 100).toFixed(2) })]
          );
        } catch (auditErr) {
          console.error("[Stripe Webhook] Audit log error:", auditErr);
        }

        // Emit event
        try {
          eventBus.emitSafe("CRYPTO_PURCHASE_CONFIRMED", {
            purchaseId,
            refId,
            userId,
            stripePaymentIntentId: intentId,
            amount: amount / 100,
          });
        } catch (emitErr) {
          console.error("[Stripe Webhook] EventBus error:", emitErr);
        }

        console.log(`[Stripe Webhook] CRYPTO_PURCHASE_CONFIRMED for ref ${refId} (purchase id ${purchaseId})`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const intentId = paymentIntent.id;
        const meta = paymentIntent.metadata || {};
        const refId = meta.ref_id || "unknown";

        console.log(`[Stripe Webhook] PAYMENT_FAILED: ${intentId} ref=${refId}`);

        try {
          eventBus.emitSafe("PAYMENT_FAILED", {
            stripePaymentIntentId: intentId,
            refId,
          });
        } catch (emitErr) {
          console.error("[Stripe Webhook] EventBus error:", emitErr);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing event ${event.type}:`, err);
  }

  res.json({ received: true });
}
