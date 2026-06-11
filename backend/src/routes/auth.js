import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../db/pool.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
} from "../middleware/auth.js";
import { detectJurisdiction, getClientIp } from "../lib/jurisdiction.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  domain: process.env.COOKIE_DOMAIN || ".ourea.tech",
  path: "/",
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Hash a refresh token for DB storage (never store raw tokens). */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Return a lightweight kyc_data summary (step, status, rejectionReason only).
 *  Full kyc_data with base64 documents is available at GET /api/auth/kyc. */
function kycSummary(kycData) {
  if (!kycData) return null;
  return {
    step: kycData.step ?? null,
    status: kycData.status ?? null,
    rejectionReason: kycData.rejectionReason ?? null,
    submittedAt: kycData.submittedAt ?? null,
    reviewedAt: kycData.reviewedAt ?? null,
  };
}

/** Issue both tokens and store the refresh token hash in DB.
 *  Also sets httpOnly cookies on the response. */
async function issueTokens(user, res) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);

  // Store refresh token hash in DB
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, tokenHash]
  );

  // Set httpOnly cookies
  res.cookie("psi_access_token", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 minutes
  res.cookie("psi_refresh_token", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

  return { accessToken, refreshToken };
}

// ──────────────────────────────────────────────
// POST /api/auth/signup
// ──────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (role && !["individual", "business"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'individual' or 'business'" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role || "individual";
    const jurisdiction = detectJurisdiction(getClientIp(req));
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, jurisdiction, verification_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, jurisdiction, email_verified",
      [name, email, hashedPassword, userRole, jurisdiction, verificationToken]
    );

    const user = result.rows[0];

    // Send verification email (non-blocking — don't block signup response)
    sendVerificationEmail(email, name, verificationToken).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    const tokens = await issueTokens(user, res);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, jurisdiction: user.jurisdiction, email_verified: user.email_verified, kyc_data: kycSummary(user.kyc_data) },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT id, name, email, role, jurisdiction, email_verified, kyc_data, password_hash FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const tokens = await issueTokens(user, res);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, jurisdiction: user.jurisdiction, email_verified: user.email_verified, kyc_data: kycSummary(user.kyc_data) },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/refresh
// ──────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    // Try cookie first, fall back to request body (for backward compat)
    const refreshToken = req.cookies?.psi_refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify signature & expiry
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Validate against DB (prevents token reuse if leaked)
    const tokenHash = hashToken(refreshToken);
    const stored = await pool.query(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2 AND revoked = false AND expires_at > NOW()`,
      [tokenHash, payload.id]
    );
    if (stored.rows.length === 0) {
      return res.status(401).json({ error: "Refresh token has been revoked or expired" });
    }

    // Revoke the old refresh token (rotation)
    await pool.query(
      "UPDATE refresh_tokens SET revoked = true WHERE id = $1",
      [stored.rows[0].id]
    );

    // Issue new pair
    const user = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [payload.id]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const tokens = await issueTokens(user.rows[0], res);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/logout
// ──────────────────────────────────────────────
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Revoke all active refresh tokens for this user
    await pool.query(
      "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false",
      [req.user.id]
    );

    // Clear httpOnly cookies
    res.clearCookie("psi_access_token", { domain: process.env.COOKIE_DOMAIN || ".ourea.tech", path: "/" });
    res.clearCookie("psi_refresh_token", { domain: process.env.COOKIE_DOMAIN || ".ourea.tech", path: "/" });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/logout-all (revoke everywhere)
// ──────────────────────────────────────────────
router.post("/logout-all", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1",
      [req.user.id]
    );

    // Clear httpOnly cookies
    res.clearCookie("psi_access_token", { domain: process.env.COOKIE_DOMAIN || ".ourea.tech", path: "/" });
    res.clearCookie("psi_refresh_token", { domain: process.env.COOKIE_DOMAIN || ".ourea.tech", path: "/" });

    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    console.error("Logout-all error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/verify-email
// ──────────────────────────────────────────────
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const result = await pool.query(
      "SELECT id, name, email, role, jurisdiction FROM users WHERE verification_token = $1 AND email_verified = false",
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    const user = result.rows[0];
    await pool.query(
      "UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1",
      [user.id]
    );

    // Issue tokens so the user is auto-logged in
    const tokens = await issueTokens(user, res);

    res.json({
      message: "Email verified successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role, jurisdiction: user.jurisdiction, email_verified: true },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/resend-verification
// ──────────────────────────────────────────────
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await pool.query(
      "SELECT id, name, email_verified FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      // Don't reveal whether the email exists
      return res.json({ message: "If an account exists, a verification email has been sent" });
    }

    const user = result.rows[0];
    if (user.email_verified) {
      return res.json({ message: "Email is already verified" });
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    await pool.query(
      "UPDATE users SET verification_token = $1 WHERE id = $2",
      [newToken, user.id]
    );

    sendVerificationEmail(email, user.name, newToken).catch((err) => {
      console.error("Failed to resend verification email:", err);
    });

    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/forgot-password
// ──────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: "If an account exists, a reset link has been sent" });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Invalidate any existing unused reset tokens for this user
    await pool.query(
      "UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false",
      [user.id]
    );

    // Create new reset token (expires in 1 hour)
    await pool.query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
      [user.id, tokenHash]
    );

    // Send reset email (non-blocking)
    sendPasswordResetEmail(email, user.name, token).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });

    res.json({ message: "If an account exists, a reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/reset-password
// ──────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid unused token
    const resetResult = await pool.query(
      `SELECT pr.id, pr.user_id, u.email, u.name
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1 AND pr.used = false AND pr.expires_at > NOW()`,
      [tokenHash]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ error: "This reset link is invalid or has expired" });
    }

    const reset = resetResult.rows[0];

    // Mark token as used immediately (single use)
    await pool.query(
      "UPDATE password_resets SET used = true WHERE id = $1",
      [reset.id]
    );

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, reset.user_id]
    );

    // Revoke all refresh tokens (force re-login on all devices)
    await pool.query(
      "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1",
      [reset.user_id]
    );

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, jurisdiction, email_verified, kyc_data, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const row = result.rows[0];
    res.json({
      user: {
        ...row,
        kyc_data: kycSummary(row.kyc_data),
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/kyc
// ──────────────────────────────────────────────
router.get("/kyc", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT kyc_data FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ kyc: result.rows[0].kyc_data });
  } catch (err) {
    console.error("KYC get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// PUT /api/auth/kyc
// ──────────────────────────────────────────────
router.put("/kyc", authMiddleware, async (req, res) => {
  try {
    const { kycData } = req.body;
    if (!kycData || typeof kycData !== "object") {
      return res.status(400).json({ error: "kycData object is required" });
    }

    // Validate allowed fields
    const allowed = ["step", "status", "personalInfo", "identityDocs", "addressDocs", "businessInfo", "directors", "businessDocs"];
    const cleaned = {};
    for (const key of allowed) {
      if (kycData[key] !== undefined) {
        cleaned[key] = kycData[key];
      }
    }

    // Merge with existing data
    const current = await pool.query("SELECT kyc_data FROM users WHERE id = $1", [req.user.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const merged = { ...current.rows[0].kyc_data, ...cleaned };

    await pool.query(
      "UPDATE users SET kyc_data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(merged), req.user.id]
    );

    res.json({ kyc: merged });
  } catch (err) {
    console.error("KYC save error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
