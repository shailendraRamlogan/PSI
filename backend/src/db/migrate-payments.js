import pool from "./pool.js";

async function migrate() {
  console.log("Running payments migration...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id SERIAL PRIMARY KEY,
      ref_id VARCHAR(20) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'TTD',
      beneficiary_company_name VARCHAR(255) NOT NULL,
      beneficiary_bank_name VARCHAR(255) NOT NULL,
      beneficiary_account_number VARCHAR(100) NOT NULL,
      beneficiary_routing_number VARCHAR(100),
      beneficiary_bank_country VARCHAR(100),
      beneficiary_reference TEXT,
      receipt_path VARCHAR(500),
      transfer_proof_path VARCHAR(500),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'paid')),
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      received_at TIMESTAMPTZ,
      paid_at TIMESTAMPTZ,
      received_by INTEGER REFERENCES users(id),
      paid_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("  ✓ payment_requests table");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_audit_log (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      performed_by INTEGER NOT NULL REFERENCES users(id),
      role VARCHAR(20) NOT NULL,
      note TEXT,
      proof_path VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("  ✓ payment_audit_log table");

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
    CREATE INDEX IF NOT EXISTS idx_payment_audit_log_request_id ON payment_audit_log(request_id);
  `);
  console.log("  ✓ indexes");

  // Add remittance tracking columns (idempotent)
  const colCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'payment_requests' AND column_name = 'remittance_amount'
  `);
  if (colCheck.rows.length === 0) {
    await pool.query(`
      ALTER TABLE payment_requests
        ADD COLUMN remittance_amount DECIMAL(15,2),
        ADD COLUMN remittance_currency VARCHAR(10) DEFAULT 'USD'
    `);
    console.log("  ✓ remittance_amount + remittance_currency columns");
  } else {
    console.log("  ✓ remittance columns already exist");
  }

  console.log("Done.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
