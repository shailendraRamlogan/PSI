import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pool from "./db/pool.js";
import authRoutes from "./routes/auth.js";
import kycRoutes from "./routes/kyc.js";
import kybRoutes from "./routes/kyb.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import statsRoutes from "./routes/stats.js";

const app = express();

// Middleware
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: "15mb" })); // 15mb for base64 file uploads
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/kyb", kybRoutes);
app.use("/api/admin/kyc", adminRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/stats", statsRoutes);

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
