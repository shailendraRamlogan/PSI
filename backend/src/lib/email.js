import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "PSI <onboarding@resend.dev>";

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
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #20aab6; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 14px;">P</div>
            <span style="color: #ffffff; font-weight: 600; font-size: 18px; letter-spacing: 0.5px;">PSI</span>
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
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #20aab6; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 14px;">P</div>
            <span style="color: #ffffff; font-weight: 600; font-size: 18px; letter-spacing: 0.5px;">PSI</span>
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
