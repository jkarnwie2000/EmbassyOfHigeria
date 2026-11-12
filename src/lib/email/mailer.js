import { env } from '../env';

/** In tests, sent mail is captured here instead of being delivered. */
export const testOutbox = [];

let transporter;
async function getTransporter() {
  if (!transporter) {
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

/**
 * Sends an email. Failures are logged and swallowed: an email outage must never
 * roll back a saved application or a confirmed payment.
 */
export async function sendEmail({ to, subject, html, text }) {
  const message = { from: env.emailFrom, to, subject, html, text };
  try {
    switch (env.emailTransport) {
      case 'test':
        testOutbox.push(message);
        return { ok: true };
      case 'console':
        console.info(`[email] to=${to} subject="${subject}"\n${text}\n`);
        return { ok: true };
      case 'smtp':
        await (await getTransporter()).sendMail(message);
        return { ok: true };
      default:
        throw new Error(`Unknown EMAIL_TRANSPORT ${env.emailTransport}`);
    }
  } catch (err) {
    console.error('[email] send failed', subject, err?.message);
    return { ok: false };
  }
}
