import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'admin.expenses@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'gfiejjrisdusuzqk';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TagIt Support <admin.expenses@gmail.com>';

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface SendResetPasswordEmailParams {
  to: string;
  name?: string;
  resetUrl: string;
}

export function getResetPasswordTemplate(name: string, resetUrl: string): string {
  const userName = name || 'User';
  let siteUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  try {
    if (resetUrl) {
      siteUrl = new URL(resetUrl).origin;
    }
  } catch {
    // ignore
  }

  const isLocal = !siteUrl || siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1');
  const siteDomain = isLocal ? 'TagIt Suite' : siteUrl.replace(/^https?:\/\//, '');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - TagIt</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #121218;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #121218;
      padding: 40px 16px;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #1d1d26;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
    }
    .heading {
      font-size: 26px;
      font-weight: 700;
      color: #10b981;
      margin-top: 0;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    .subtagline {
      font-size: 12px;
      color: #10b981;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 8px 0;
    }
    .btn-container {
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      padding: 14px 36px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
      transition: all 0.2s ease;
    }
    .warning-text {
      font-size: 14px;
      font-weight: 700;
      color: #34d399;
      margin: 24px 0 16px 0;
      line-height: 1.5;
    }
    .disclaimer-text {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }
    .footer-box {
      background-color: #16161f;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 12px 16px;
      display: inline-block;
      font-size: 13px;
      color: #94a3b8;
    }
    .footer-link {
      color: #94a3b8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <h1 class="heading">TagIt Password Reset</h1>
      <div class="subtagline">Tag it. Pay it. Track it.</div>
      
      <p class="body-text">Hello ${userName},</p>
      <p class="body-text">We received a request to reset your TagIt account password.</p>
      <p class="body-text">Please click the button below to reset your password (link expires in 10 minutes):</p>

      <div class="btn-container">
        <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
      </div>

      <p class="warning-text">Important: For your security, do not share this link with anyone.</p>

      <p class="disclaimer-text">If you did not request this link or this email was sent in error, please ignore it.</p>

      <div class="footer-box">
        ${isLocal ? '🏷️ TagIt — Tag it. Pay it. Track it.' : `🏷️ <a href="${siteUrl}" target="_blank" class="footer-link">${siteDomain}</a>`}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendResetPasswordEmail({ to, name, resetUrl }: SendResetPasswordEmailParams) {
  const html = getResetPasswordTemplate(name || 'User', resetUrl);

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Reset your password - TagIt',
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[mailer] Reset email sent to ${to}: messageId = ${info.messageId}`);
  return info;
}

export interface SendOtpEmailParams {
  to: string;
  name?: string;
  otp: string;
}

export function getOtpTemplate(name: string, otp: string): string {
  const userName = name || 'User';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - TagIt</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #121218;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #121218;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #1d1d26;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
    }
    .heading {
      font-size: 28px;
      font-weight: 800;
      color: #10b981;
      margin-top: 0;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    .subtagline {
      font-size: 12px;
      color: #10b981;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 8px 0;
    }
    .otp-box {
      margin: 28px 0;
      background-color: #16161f;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      padding: 20px 24px;
      display: inline-block;
    }
    .otp-code {
      font-family: monospace, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #10b981;
      letter-spacing: 10px;
      margin: 0;
    }
    .warning-text {
      font-size: 14px;
      font-weight: 600;
      color: #34d399;
      margin: 20px 0 16px 0;
      line-height: 1.5;
    }
    .disclaimer-text {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 28px 0;
    }
    .footer-box {
      background-color: #16161f;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 12px 16px;
      display: inline-block;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <h1 class="heading">TagIt</h1>
      <div class="subtagline">Tag it. Pay it. Track it.</div>
      
      <p class="body-text">Hello ${userName},</p>
      <p class="body-text">Thank you for registering with TagIt. Please enter the 6-digit verification code below to activate your account:</p>

      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>

      <p class="warning-text">This verification code will expire in 10 minutes.</p>
      <p class="disclaimer-text">If you did not initiate this registration, please ignore this email.</p>

      <div class="footer-box">
        🏷️ TagIt — Tag it. Pay it. Track it.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOtpEmail({ to, name, otp }: SendOtpEmailParams) {
  const html = getOtpTemplate(name || 'User', otp);

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: `${otp} is your TagIt verification code`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[mailer] OTP email sent to ${to}: messageId = ${info.messageId}`);
  return info;
}
