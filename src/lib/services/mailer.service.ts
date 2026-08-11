import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'admin.expenses@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'gfiejjrisdusuzqk';
const EMAIL_FROM = process.env.EMAIL_FROM || 'VaultCash Support <admin.expenses@gmail.com>';

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
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const siteDomain = siteUrl.replace(/^https?:\/\//, '');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
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
      margin-bottom: 20px;
      letter-spacing: -0.02em;
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
      <h1 class="heading">Hello ${userName}!</h1>
      
      <p class="body-text">We received a request to reset your account password.</p>
      <p class="body-text">Please use the link below to proceed (link expires in 10 minutes).</p>

      <div class="btn-container">
        <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
      </div>

      <p class="warning-text">Important: For your security, do not share this link with anyone.</p>

      <p class="disclaimer-text">If you did not request this link or this email has been sent to you in error, please contact our support team.</p>

      <div class="footer-box">
        💻 <a href="${siteUrl}" target="_blank" class="footer-link">${siteDomain}</a>
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
    subject: 'Reset your password',
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[mailer] Reset email sent to ${to}: messageId = ${info.messageId}`);
  return info;
}
