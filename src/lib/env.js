/**
 * Centralised, validated access to server-side environment variables.
 * Never import this module from client components.
 */

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get appUrl() {
    return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  },
  get isProduction() {
    return process.env.NODE_ENV === 'production';
  },
  get appSecret() {
    const secret = required('APP_SECRET');
    if (secret.length < 32) throw new Error('APP_SECRET must be at least 32 characters');
    return secret;
  },
  get stripeSecretKey() {
    return required('STRIPE_SECRET_KEY');
  },
  get stripeWebhookSecret() {
    return required('STRIPE_WEBHOOK_SECRET');
  },
  get storageDriver() {
    return process.env.STORAGE_DRIVER || 'local';
  },
  get emailTransport() {
    return process.env.EMAIL_TRANSPORT || 'console';
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || 'Embassy Portal (Demo) <no-reply@example.org>';
  },
  sessionTtlHours(isStaff) {
    const raw = isStaff ? process.env.SESSION_TTL_HOURS_STAFF : process.env.SESSION_TTL_HOURS_APPLICANT;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : isStaff ? 8 : 72;
  },
};
