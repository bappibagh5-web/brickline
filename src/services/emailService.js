const { Resend } = require('resend');

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY in environment variables.');
  }

  return new Resend(apiKey);
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
}

function getFrontendBaseUrl() {
  return String(process.env.FRONTEND_BASE_URL || 'http://localhost:5174')
    .trim()
    .replace(/\/+$/, '');
}

async function sendMagicLinkEmail(email, applicationId) {
  const recipient = String(email || '').trim().toLowerCase();
  if (!recipient) {
    throw new Error('Email is required to send magic link.');
  }

  const frontendBaseUrl = getFrontendBaseUrl();
  const link = `${frontendBaseUrl}/set-password?applicationId=${applicationId}`;
  const resend = getResendClient();
  const fromAddress = getFromAddress();

  const { error } = await resend.emails.send({
    from: `Brickline <${fromAddress}>`,
    to: recipient,
    subject: 'Continue your Brickline application',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2747;">
        <h2 style="margin: 0 0 12px;">Continue your Brickline application</h2>
        <p style="margin: 0 0 16px;">
          Click the secure link below to set your password and continue your application.
        </p>
        <p style="margin: 0 0 20px;">
          <a href="${link}" style="background:#2f54eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">
            Continue Application
          </a>
        </p>
        <p style="margin: 0; font-size: 13px; color: #5f6b8f;">
          If the button does not work, open this URL:<br />
          ${link}
        </p>
      </div>
    `
  });

  if (error) {
    throw new Error(error.message || 'Failed to send email.');
  }

  return { ok: true, link };
}

module.exports = {
  sendMagicLinkEmail
};
