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
        <div style="padding: 40px 32px;">
          <div style="text-align:center;margin-bottom:32px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="160" style="display:block;margin:0 auto" />
          </div>

          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Purchase Confirmed</h1>
          <p style="color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
            Hi ${name},<br/>
            Your crypto purchase has been confirmed. We're processing your order and will remit the crypto to your wallet shortly.
          </p>

          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Reference</p>
            <p style="color:#20aab6;font-size:14px;font-weight:600;margin:0 0 16px;">${refId}</p>
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:rgba(255,255,255,0.5);font-size:13px;">Amount</span>
                <span style="color:#fff;font-size:14px;font-weight:600;">$${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:rgba(255,255,255,0.5);font-size:13px;">Handling Fee</span>
                <span style="color:#fff;font-size:14px;">$${parseFloat(fee).toFixed(2)}</span>
              </div>
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;display:flex;justify-content:space-between;">
                <span style="color:rgba(255,255,255,0.5);font-size:13px;font-weight:600;">Total Charged</span>
                <span style="color:#fff;font-size:15px;font-weight:700;">$${parseFloat(total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Destination</p>
            <p style="color:#fff;font-size:14px;margin:0 0 4px;">${walletLabel || 'Wallet'}</p>
            <p style="color:rgba(255,255,255,0.5);font-size:12px;word-break:break-all;margin:0;">${walletAddress}</p>
            <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:8px 0 0;">Network: ${network}</p>
          </div>

          <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">
            You'll receive a second email once the crypto has been remitted to your wallet.
          </p>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 0;">Payment Solutions International</p>
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
        <div style="padding: 40px 32px;">
          <div style="text-align:center;margin-bottom:32px">
            <img src="https://psi.ourea.tech/images/psi-logo.png" alt="PSI" width="160" style="display:block;margin:0 auto" />
          </div>

          <h1 style="color: #10b981; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Crypto Remitted ✓</h1>
          <p style="color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
            Hi ${name},<br/>
            Your crypto has been successfully remitted to your wallet.
          </p>

          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Reference</p>
            <p style="color:#20aab6;font-size:14px;font-weight:600;margin:0 0 16px;">${refId}</p>
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:rgba(255,255,255,0.5);font-size:13px;">Amount</span>
                <span style="color:#fff;font-size:14px;font-weight:600;">$${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:rgba(255,255,255,0.5);font-size:13px;">Network</span>
                <span style="color:#fff;font-size:14px;">${network}</span>
              </div>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Transaction Hash</p>
            <p style="color:#fff;font-size:12px;word-break:break-all;margin:0;">${transactionHash}</p>
          </div>

          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Sent To</p>
            <p style="color:#fff;font-size:14px;margin:0 0 4px;">${walletLabel || 'Wallet'}</p>
            <p style="color:rgba(255,255,255,0.5);font-size:12px;word-break:break-all;margin:0;">${walletAddress}</p>
          </div>

          <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">
            Blockchain confirmations may take a few minutes to complete.
          </p>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 0;">Payment Solutions International</p>
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
