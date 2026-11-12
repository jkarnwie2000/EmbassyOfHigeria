import Stripe from 'stripe';
import { env } from './env';

let client;
let override;

/** Server-only Stripe client. The secret key never reaches the browser. */
export function getStripe() {
  if (override) return override;
  if (!client) {
    const key = env.stripeSecretKey;
    if (env.isProduction === false && !key.startsWith('sk_test_') && !key.startsWith('rk_test_')) {
      throw new Error('Use Stripe TEST MODE keys outside production.');
    }
    client = new Stripe(key, { appInfo: { name: 'Embassy Portal (Demo)' } });
  }
  return client;
}

/** Test hook: replace the Stripe client with a stub. */
export function __setStripeClientForTests(stub) {
  override = stub;
}

/** Signature verification uses Stripe's SDK, which works without network access. */
export function constructWebhookEvent(rawBody, signature) {
  return Stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}
