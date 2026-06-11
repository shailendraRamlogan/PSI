import pool from "./pool.js";

async function migrate() {
  console.log("Running platform_settings migration...");

  const colCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'platform_settings' AND column_name = 'key'
  `);

  if (colCheck.rows.length === 0) {
    await pool.query(`
      CREATE TABLE platform_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id)
      );
    `);
    console.log("  ✓ platform_settings table");

    await pool.query(`
      INSERT INTO platform_settings (key, value, updated_by)
      VALUES ('crypto_handling_fee', '0.00', 21)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log("  ✓ default crypto_handling_fee row (0.00)");
  } else {
    console.log("  ✓ platform_settings table already exists");
  }

  console.log("Done.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
