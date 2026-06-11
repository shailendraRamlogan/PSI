import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/pool.js";
import authRoutes from "./routes/auth.js";
import kycRoutes from "./routes/kyc.js";
import kybRoutes from "./routes/kyb.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import statsRoutes from "./routes/stats.js";
import paymentRoutes from "./routes/payments.js";
import walletRoutes from "./routes/wallets.js";
import settingsRoutes from "./routes/settings.js";
import cryptoPurchaseRoutes from "./routes/crypto-purchases.js";
import supportRoutes from "./routes/support.js";
import adminSupportRoutes from "./routes/admin-support.js";
import { stripeWebhookHandler } from "./routes/stripe-webhooks.js";

const app = express();

// Middleware
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
  credentials: true,
}));

// Stripe webhook — raw body BEFORE json parser
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "15mb" })); // 15mb for base64 file uploads
app.use(cookieParser());

// Static file serving for uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    res.setHeader("Content-Disposition", "inline");
  },
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/kyb", kybRoutes);
app.use("/api/admin/kyc", adminRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/stats", statsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/crypto-purchases", cryptoPurchaseRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin/support", adminSupportRoutes);

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

export default app;
