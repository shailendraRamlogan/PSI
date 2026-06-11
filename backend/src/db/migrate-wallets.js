import pool from "./pool.js";

const ALLOWED_NETWORKS = [
  "Bitcoin", "Ethereum", "BNB Chain", "Tron",
  "Solana", "Polygon", "Avalanche", "Arbitrum", "Optimism", "Base",
];

async function migrate() {
  console.log("Running saved_wallets migration...");

  const colCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'saved_wallets' AND column_name = 'wallet_address'
  `);

  if (colCheck.rows.length === 0) {
    // Create enum for networks
    try {
      await pool.query(`
        CREATE TYPE wallet_network AS ENUM (
          ${ALLOWED_NETWORKS.map(n => `'${n}'`).join(", ")}
        );
      `);
      console.log("  ✓ wallet_network enum");
    } catch (e) {
      if (!e.message.includes("already exists")) throw e;
      console.log("  ✓ wallet_network enum (already exists)");
    }

    await pool.query(`
      CREATE TABLE saved_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(100) NOT NULL,
        wallet_address VARCHAR(200) NOT NULL,
        network wallet_network NOT NULL,
        memo VARCHAR(200),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ saved_wallets table");

    await pool.query(`
      CREATE INDEX idx_saved_wallets_user_id ON saved_wallets(user_id);
    `);
    console.log("  ✓ index");
  } else {
    console.log("  ✓ saved_wallets table already exists");
  }

  console.log("Done.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
