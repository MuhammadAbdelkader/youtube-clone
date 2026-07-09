const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = "YouCube";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function sendVerificationEmail(toEmail, otp, username) {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM}>`,
      to: [toEmail],
      subject: `${otp} — Verify your YouCube account`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Verify your YouCube account</title>
        </head>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Inter',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d50;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                      &#x25B6; YouCube
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your streaming universe</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 8px;color:#e2e8f0;font-size:22px;font-weight:700;">Welcome, ${username}!</h2>
                    <p style="margin:0 0 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Use the verification code below to confirm your email address. This code expires in <strong style="color:#f87171;">5 minutes</strong>.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:#0f0f23;border:2px solid #ef4444;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
                      <p style="margin:0;color:#f87171;font-size:42px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                      If you didn't create a YouCube account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #2d2d50;text-align:center;">
                    <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} YouCube. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    const isSandboxRestriction = error.message?.includes("403") || JSON.stringify(error).includes("403");

    if (isSandboxRestriction && !IS_PRODUCTION) {
      // In development environments without a verified Resend domain, output the OTP
      // to the console to facilitate local testing of the authentication flow.
      console.info("[Dev] Resend Sandbox restricted. OTP Code bypass generated.");
      console.info(`[Dev] OTP Code: ${otp} | Target: ${toEmail}`);
      return;
    }

    if (isSandboxRestriction) {
      // In production this must fail loudly -- silently "succeeding" here means
      // real users get told to check an email that was never sent.
      throw new Error(
        "Email delivery is not configured for production: verify a sending domain in Resend " +
        "(resend.com/domains) and set FROM_EMAIL to an address on that domain."
      );
    }

    throw new Error(`Resend email error: ${JSON.stringify(error)}`);
  }
}

/**
 * Send a password-reset OTP email.
 * @param {string} toEmail
 * @param {string} otp      - 6-digit numeric string
 */
async function sendPasswordResetEmail(toEmail, otp) {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM}>`,
      to: [toEmail],
      subject: `${otp} — Reset your YouCube password`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Reset your YouCube password</title>
        </head>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Inter',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d50;">
                <tr>
                  <td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">&#x25B6; YouCube</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Password Reset Request</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px;">
                    <p style="margin:0 0 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      We received a request to reset your password. Enter this code to proceed. It expires in <strong style="color:#f87171;">5 minutes</strong>.
                    </p>
                    <div style="background:#0f0f23;border:2px solid #ef4444;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Reset Code</p>
                      <p style="margin:0;color:#f87171;font-size:42px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                      If you didn't request this, your account is safe — no action needed.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #2d2d50;text-align:center;">
                    <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} YouCube. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    const isSandboxRestriction = error.message?.includes("403") || JSON.stringify(error).includes("403");

    if (isSandboxRestriction && !IS_PRODUCTION) {
      // Output OTP to console for local testing without a verified domain.
      console.info("[Dev] Resend Sandbox restricted. Password Reset OTP bypass generated.");
      console.info(`[Dev] Reset Code: ${otp} | Target: ${toEmail}`);
      return;
    }

    if (isSandboxRestriction) {
      throw new Error(
        "Email delivery is not configured for production: verify a sending domain in Resend " +
        "(resend.com/domains) and set FROM_EMAIL to an address on that domain."
      );
    }

    throw new Error(`Resend email error: ${JSON.stringify(error)}`);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
