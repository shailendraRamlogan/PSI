import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "PSI <support@ourea.tech>";

/**
 * Generic email sender.
 */
export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
  if (error) {
    console.error("Resend email error:", error);
    throw new Error("Failed to send email");
  }
  return data;
}

/**
 * Send a verification email with a confirmation link.
 */
export async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || "https://psi.ourea.tech"}/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your PSI account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f1a; border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 32px;">
          <div style="text-align:center;margin-bottom:32px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="160" style="display:block;margin:0 auto" />
          </div>

          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Verify your email</h1>
          <p style="color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
            Hi ${name},<br/>
            Please confirm your email address to activate your PSI account.
          </p>

          <a href="${verifyUrl}" style="display: inline-block; background: #20aab6; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 50px; box-shadow: 0 0 20px rgba(32,170,182,0.25);">
            Verify My Email
          </a>

          <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 28px 0 0;">
            If you didn't create a PSI account, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 0;">Payment Solutions International</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error("Failed to send verification email");
  }

  return data;
}

/**
 * Send a password reset email with a single-use link.
 */
export async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${process.env.FRONTEND_URL || "https://psi.ourea.tech"}/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your PSI password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f1a; border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 32px;">
          <div style="text-align:center;margin-bottom:32px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="160" style="display:block;margin:0 auto" />
          </div>

          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Reset your password</h1>
          <p style="color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
            Hi ${name},<br/>
            We received a request to reset your password. Click the button below to choose a new one.
          </p>

          <a href="${resetUrl}" style="display: inline-block; background: #20aab6; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 50px; box-shadow: 0 0 20px rgba(32,170,182,0.25);">
            Reset Password
          </a>

          <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 28px 0 0;">
            This link can only be used once and expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 0;">Payment Solutions International</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend password reset email error:", error);
    throw new Error("Failed to send password reset email");
  }

  return data;
}

/**
 * Send a crypto purchase receipt email when payment succeeds.
 */
export async function sendCryptoPurchaseReceipt({ email, name, refId, amount, fee, total, network, walletAddress, walletLabel }) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `PSI — Crypto Purchase Confirmed (${refId})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f1a; border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 32px 24px;">
          <div style="text-align:center;margin-bottom:32px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="120" style="display:block;margin:0 auto" />
          </div>

          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:rgba(16,185,129,0.12);color:#10b981;font-size:12px;font-weight:600;padding:6px 16px;border-radius:50px;margin-bottom:16px;letter-spacing:0.5px;">PURCHASE CONFIRMED</div>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px;">Crypto Purchase Receipt</h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0;">
              Hi ${name}, your crypto purchase has been confirmed.
            </p>
          </div>

          <!-- Reference -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;margin:0 0 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Transaction Reference</td>
              </tr>
              <tr>
                <td style="color:#20aab6;font-size:15px;font-weight:600;font-family:monospace;letter-spacing:0.5px;">${refId}</td>
              </tr>
            </table>
          </div>

          <!-- Order Details -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 16px;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;font-weight:600;">Order Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Crypto Amount</td>
                <td style="color:#fff;font-size:14px;font-weight:600;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;">$${parseFloat(amount).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Network</td>
                <td style="color:rgba(255,255,255,0.7);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;">${network}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Handling Fee (${parseFloat(fee) > 0 ? ((parseFloat(fee)/parseFloat(amount))*100).toFixed(0) : '0'}%)</td>
                <td style="color:rgba(255,255,255,0.7);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;">$${parseFloat(fee).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color:#fff;font-size:14px;font-weight:700;padding:10px 0 0;">Total Charged</td>
                <td style="color:#fff;font-size:15px;font-weight:700;padding:10px 0 0;text-align:right;">$${parseFloat(total).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Destination Wallet -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:600;">Destination Wallet</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:12px;padding:3px 0;">Label</td>
              </tr>
              <tr>
                <td style="color:#fff;font-size:14px;font-weight:500;padding:0 0 10px;">${walletLabel || 'No label'}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:12px;padding:3px 0;">Address</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.6);font-size:12px;font-family:monospace;word-break:break-all;padding:0 0 4px;">${walletAddress}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.3);font-size:11px;padding:4px 0 0;">${network}</td>
              </tr>
            </table>
          </div>

          <!-- What's Next -->
          <div style="margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;font-weight:600;">What's Next?</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;padding:0 12px 14px 0;width:24px;">
                  <div style="width:24px;height:24px;background:rgba(16,185,129,0.15);border-radius:50%;text-align:center;line-height:24px;font-size:12px;">✓</div>
                </td>
                <td style="color:rgba(255,255,255,0.6);font-size:13px;padding:2px 0 14px;">Payment confirmed — we're processing your order</td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding:0 12px 14px 0;width:24px;">
                  <div style="width:24px;height:24px;background:rgba(32,170,182,0.15);border-radius:50%;text-align:center;line-height:24px;font-size:12px;color:#20aab6;">2</div>
                </td>
                <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:2px 0 14px;">Crypto will be remitted to your wallet</td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding:0 12px 0 0;width:24px;">
                  <div style="width:24px;height:24px;background:rgba(255,255,255,0.04);border-radius:50%;text-align:center;line-height:24px;font-size:12px;color:rgba(255,255,255,0.3);">3</div>
                </td>
                <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:2px 0;">You'll receive a confirmation email</td>
              </tr>
            </table>
          </div>

        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">Payment Solutions International</p>
        </div>
      </div>
    `,
  });
  if (error) {
    console.error("Resend crypto purchase receipt error:", error);
    throw new Error("Failed to send crypto purchase receipt");
  }
  return data;
}

/**
 * Send a crypto remittance confirmation email when crypto is sent to the wallet.
 */
export async function sendCryptoRemittanceConfirmation({ email, name, refId, amount, network, walletAddress, walletLabel, transactionHash }) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `PSI — Crypto Remitted to Your Wallet (${refId})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f1a; border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 32px 24px;">
          <div style="text-align:center;margin-bottom:32px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="120" style="display:block;margin:0 auto" />
          </div>

          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:rgba(16,185,129,0.12);color:#10b981;font-size:12px;font-weight:600;padding:6px 16px;border-radius:50px;margin-bottom:16px;letter-spacing:0.5px;">REMITTANCE COMPLETE</div>
            <h1 style="color: #10b981; font-size: 22px; font-weight: 700; margin: 0 0 6px;">Crypto Delivered ✓</h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0;">
              Hi ${name}, your crypto has been remitted to your wallet.
            </p>
          </div>

          <!-- Reference -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;margin:0 0 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Transaction Reference</td>
              </tr>
              <tr>
                <td style="color:#20aab6;font-size:15px;font-weight:600;font-family:monospace;letter-spacing:0.5px;">${refId}</td>
              </tr>
            </table>
          </div>

          <!-- Order Details -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 16px;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;font-weight:600;">Transaction Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Amount</td>
                <td style="color:#fff;font-size:14px;font-weight:600;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;">$${parseFloat(amount).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Network</td>
                <td style="color:rgba(255,255,255,0.7);font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;">${network}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:13px;padding:6px 0;">Status</td>
                <td style="color:#10b981;font-size:13px;font-weight:600;padding:6px 0;text-align:right;">Completed</td>
              </tr>
            </table>
          </div>

          <!-- Transaction Hash -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 16px;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;font-weight:600;">Transaction Hash</p>
            <p style="color:rgba(255,255,255,0.6);font-size:12px;font-family:monospace;word-break:break-all;margin:0 0 10px;">${transactionHash}</p>
            <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">Blockchain confirmations may take a few minutes.</p>
          </div>

          <!-- Destination Wallet -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:600;">Sent To</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:12px;padding:3px 0;">Label</td>
              </tr>
              <tr>
                <td style="color:#fff;font-size:14px;font-weight:500;padding:0 0 10px;">${walletLabel || 'No label'}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.45);font-size:12px;padding:3px 0;">Address</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.6);font-size:12px;font-family:monospace;word-break:break-all;padding:0;">${walletAddress}</td>
              </tr>
            </table>
          </div>

        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">Payment Solutions International</p>
        </div>
      </div>
    `,
  });
  if (error) {
    console.error("Resend crypto remittance email error:", error);
    throw new Error("Failed to send crypto remittance email");
  }
  return data;
}

/**
 * Admin notification — new crypto purchase confirmed.
 */
export async function sendAdminCryptoPurchaseAlert({ refId, userName, amount, fee, total, network, walletAddress, walletLabel }) {
  const dashboardUrl = `${process.env.FRONTEND_URL || "https://psi.ourea.tech"}/admin/crypto-purchases`;
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [process.env.ADMIN_EMAIL || "admin@ourea.tech"],
    subject: `New Crypto Purchase — ${refId}`,
    html: `
      <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;max-width:520px;margin:0 auto;background:#0f1117;">
        <div style="padding:40px 24px;">
          <div style="text-align:center;margin-bottom:28px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="100" style="display:block;margin:0 auto" />
          </div>
          <div style="text-align:center;margin-bottom:8px">
            <div style="display:inline-block;background:rgba(0,224,161,0.12);border:1px solid rgba(0,224,161,0.3);color:#00e0a1;font-size:11px;font-weight:600;letter-spacing:0.06em;padding:5px 14px;border-radius:50px;">NEW PURCHASE</div>
          </div>
          <h1 style="color:#00e0a1;font-size:26px;font-weight:700;margin:0 0 8px;text-align:center;">Crypto Purchase Confirmed</h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.6;margin:0 auto 28px;text-align:center;max-width:400px;">A new crypto purchase has been confirmed. Please remit the crypto to the customer's wallet.</p>
          <div style="margin-bottom:12px">
            <div style="background:#1a1d27;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;">
              <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">TRANSACTION DETAILS</p>
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Reference</td><td style="color:#4db8ff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${refId}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Customer</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${userName}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Amount</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">$${parseFloat(amount).toFixed(2)}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Fee</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">$${parseFloat(fee).toFixed(2)}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Total Charged</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">$${parseFloat(total).toFixed(2)}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Network</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${network}</td></tr>
                </table>
              </div>
            </div>
          </div>
          <div style="margin-bottom:24px">
            <div style="background:#1a1d27;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;">
              <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">DESTINATION WALLET</p>
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${walletLabel ? `<tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Label</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${walletLabel}</td></tr>` : ''}
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Address</td><td style="color:#4db8ff;font-size:12px;font-family:monospace;word-break:break-all;text-align:right;padding:6px 0;">${walletAddress}</td></tr>
                </table>
              </div>
            </div>
          </div>
          <div style="text-align:center">
            <a href="${dashboardUrl}" style="display:inline-block;width:100%;max-width:520px;background:#00c9a7;color:#000000;text-decoration:none;font-size:14px;font-weight:600;padding:14px 0;border-radius:8px;text-align:center;">Manage in Admin</a>
          </div>
        </div>
        <div style="padding:16px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">Payment Solutions International</p>
        </div>
      </div>
    `,
  });
  if (error) {
    console.error("Resend admin crypto purchase alert error:", error);
    throw new Error("Failed to send admin crypto purchase alert");
  }
  return data;
}

/**
 * Admin notification — new payment request submitted.
 */
export async function sendAdminPaymentRequestAlert({ refId, userName, userEmail, amount, currency, feePercent, feeAmount, beneficiary }) {
  const dashboardUrl = `${process.env.FRONTEND_URL || "https://psi.ourea.tech"}/admin/payments`;
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [process.env.ADMIN_EMAIL || "admin@ourea.tech"],
    subject: `New Payment Request — ${refId}`,
    html: `
      <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;max-width:520px;margin:0 auto;background:#0f1117;">
        <div style="padding:40px 24px;">
          <div style="text-align:center;margin-bottom:28px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="100" style="display:block;margin:0 auto" />
          </div>
          <div style="text-align:center;margin-bottom:8px">
            <div style="display:inline-block;background:rgba(0,224,161,0.12);border:1px solid rgba(0,224,161,0.3);color:#00e0a1;font-size:11px;font-weight:600;letter-spacing:0.06em;padding:5px 14px;border-radius:50px;">NEW REQUEST</div>
          </div>
          <h1 style="color:#00e0a1;font-size:26px;font-weight:700;margin:0 0 8px;text-align:center;">Payment Request Submitted</h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.6;margin:0 auto 28px;text-align:center;max-width:400px;">A new payment request has been submitted and is awaiting fund confirmation.</p>
          <div style="margin-bottom:12px">
            <div style="background:#1a1d27;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;">
              <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">CUSTOMER</p>
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Name</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${userName}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Email</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${userEmail}</td></tr>
                </table>
              </div>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <div style="background:#1a1d27;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;">
              <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">PAYMENT DETAILS</p>
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Reference</td><td style="color:#4db8ff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${refId}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Amount</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${currency} ${parseFloat(amount).toFixed(2)}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Handling Fee</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${feePercent}% ($${parseFloat(feeAmount).toFixed(2)})</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:14px;padding:6px 0;">Beneficiary</td><td style="color:#ffffff;font-size:14px;font-weight:500;text-align:right;padding:6px 0;">${beneficiary}</td></tr>
                </table>
              </div>
            </div>
          </div>
          <div style="text-align:center">
            <a href="${dashboardUrl}" style="display:inline-block;width:100%;max-width:520px;background:#00c9a7;color:#000000;text-decoration:none;font-size:14px;font-weight:600;padding:14px 0;border-radius:8px;text-align:center;">Manage in Admin</a>
          </div>
        </div>
        <div style="padding:16px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">Payment Solutions International</p>
        </div>
      </div>
    `,
  });
  if (error) {
    console.error("Resend admin payment request alert error:", error);
    throw new Error("Failed to send admin payment request alert");
  }
  return data;
}
