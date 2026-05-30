import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "psi_db",
  user: process.env.DB_USER || "psi_user",
  password: process.env.DB_PASSWORD || "PSI_2024_Backend!",
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
  process.exit(-1);
});

export default pool;
