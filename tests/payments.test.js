import crypto from 'node:crypto';
import Stripe from 'stripe';
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { __setStripeClientForTests } from '@/lib/stripe';
import { POST as checkout } from '@/app/api/payments/checkout/route';
import { GET as bySession } from '@/app/api/payments/session/route';
import { GET as receipt } from '@/app/api/payments/[id]/receipt/route';
import { POST as webhook } from '@/app/api/stripe/webhook/route';
import { testOutbox } from '@/lib/email';
import { makeReq, call, registerApplicant } from './helpers';
import { submittedApplication } from './flows';

const SECRET = 'whsec_unit_test_secret';
let created;

// Stub only the outbound Stripe API calls. Webhook signature verification below uses the real Stripe SDK.
beforeEach(() => {
  created = [];
  const sessions = new Map();
  __setStripeClientForTests({
    checkout: {
      sessions: {
        create: async (params, opts) => {
          const s = { id: `cs_test_${crypto.randomBytes(12).toString('hex')}`, url: 'https://checkout.stripe.com/c/pay/test', status: 'open', params, opts };
          sessions.set(s.id, s);
          created.push(s);
          return s;
        },
        retrieve: async (id) => sessions.get(id),
        expire: async (id) => Object.assign(sessions.get(id), { status: 'expired' }),
      },
    },
  });
});

function signedWebhook(event) {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return makeReq('POST', '/api/stripe/webhook', { body: payload, headers: { 'stripe-signature': header }, origin: null });
}

const completedEvent = (session, overrides = {}) => ({
  id: `evt_${crypto.randomBytes(10).toString('hex')}`,
  type: 'checkout.session.completed',
  data: {
    object: {
      id: session.id,
      object: 'checkout.session',
      payment_status: 'paid',
      amount_total: session.params.line_items.reduce((s, li) => s + li.price_data.unit_amount, 0),
      currency: 'usd',
      payment_intent: `pi_${crypto.randomBytes(8).toString('hex')}`,
      metadata: session.params.metadata,
      ...overrides,
    },
  },
});

async function startCheckout() {
  const ctx = await submittedApplication('PASSPORT');
  const r = await call(checkout, makeReq('POST', '/api/payments/checkout', { cookie: ctx.applicant.cookie, body: { applicationId: ctx.appId, amount: 1 } }));
  expect(r.status).toBe(200);
  return { ...ctx, session: created.at(-1) };
}

describe('5. Stripe checkout', () => {
  it('creates a Checkout Session from server-side fees (ignores client amounts) with metadata and idempotency', async () => {
    const { appId, session, category } = await startCheckout();
    expect(session.params.mode).toBe('payment');
    const total = session.params.line_items.reduce((s, li) => s + li.price_data.unit_amount, 0);
    expect(total).toBe(category.feeCents);
    expect(session.params.metadata.applicationId).toBe(appId);
    expect(session.params.success_url).toContain('{CHECKOUT_SESSION_ID}');
    expect(session.opts.idempotencyKey).toMatch(/^checkout-/);
    const payment = await prisma.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
    expect(payment.status).toBe('PENDING');
    expect(payment.amountCents).toBe(total);
  });

  it('reuses the open session instead of creating duplicates', async () => {
    const { applicant, appId } = await startCheckout();
    const before = created.length;
    await call(checkout, makeReq('POST', '/api/payments/checkout', { cookie: applicant.cookie, body: { applicationId: appId } }));
    expect(created.length).toBe(before);
  });

  it("refuses checkout for someone else's application", async () => {
    const { appId } = await submittedApplication('VISA');
    const other = await registerApplicant();
    const r = await call(checkout, makeReq('POST', '/api/payments/checkout', { cookie: other.cookie, body: { applicationId: appId } }));
    expect(r.status).toBe(404);
  });
});

describe('6. Stripe webhook verification', () => {
  it('rejects missing and invalid signatures', async () => {
    const { session } = await startCheckout();
    const payload = JSON.stringify(completedEvent(session));
    const none = await call(webhook, makeReq('POST', '/api/stripe/webhook', { body: payload, origin: null }));
    expect(none.status).toBe(400);
    const forged = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_attacker' });
    const bad = await call(webhook, makeReq('POST', '/api/stripe/webhook', { body: payload, headers: { 'stripe-signature': forged }, origin: null }));
    expect(bad.status).toBe(400);
    const payment = await prisma.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
    expect(payment.status).toBe('PENDING');
  });
});

describe('7. Payment confirmation', () => {
  it('confirms payment only via verified webhook, issues a receipt, updates the application and emails the applicant', async () => {
    const { applicant, appId, session, reference } = await startCheckout();

    // Before the webhook, the success page sees PENDING — the redirect alone proves nothing.
    const pre = await call(bySession, makeReq('GET', `/api/payments/session?session_id=${session.id}`, { cookie: applicant.cookie }));
    expect(pre.body.payment.status).toBe('PENDING');

    const event = completedEvent(session);
    const r = await call(webhook, signedWebhook(event));
    expect(r.status).toBe(200);

    const payment = await prisma.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
    expect(payment.status).toBe('SUCCEEDED');
    expect(payment.receiptNumber).toMatch(/^RCPT-\d{4}-/);
    const app = await prisma.application.findUnique({ where: { id: appId } });
    expect(app.status).toBe('PAYMENT_CONFIRMED');
    expect(testOutbox.some((m) => m.to === applicant.email && m.subject.includes('Payment confirmed') && m.subject.includes(reference))).toBe(true);

    // Duplicate delivery is ignored
    const dup = await call(webhook, signedWebhook(event));
    expect(dup.body.duplicate).toBe(true);
    expect(await prisma.paymentTransaction.count({ where: { paymentId: payment.id } })).toBe(1);

    // Receipt PDF is available to the owner only
    const pdf = await call(receipt, makeReq('GET', `/api/payments/${payment.id}/receipt`, { cookie: applicant.cookie }), { id: payment.id });
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');
    const other = await registerApplicant();
    const denied = await call(receipt, makeReq('GET', `/api/payments/${payment.id}/receipt`, { cookie: other.cookie }), { id: payment.id });
    expect(denied.status).toBe(404);

    // No card data is ever stored
    expect(JSON.stringify(payment)).not.toMatch(/4242|card/i);
  });

  it('does not confirm a payment whose amount does not match', async () => {
    const { appId, session } = await startCheckout();
    await call(webhook, signedWebhook(completedEvent(session, { amount_total: 1 })));
    const payment = await prisma.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
    expect(payment.status).toBe('FAILED');
    expect((await prisma.application.findUnique({ where: { id: appId } })).status).toBe('PAYMENT_PENDING');
  });

  it('handles failed and expired sessions', async () => {
    const { session, applicant } = await startCheckout();
    await call(webhook, signedWebhook({ ...completedEvent(session), type: 'checkout.session.expired', data: { object: { ...completedEvent(session).data.object, payment_status: 'unpaid' } } }));
    const payment = await prisma.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
    expect(payment.status).toBe('EXPIRED');

    const s2 = await startCheckout();
    await call(webhook, signedWebhook({ ...completedEvent(s2.session), type: 'checkout.session.async_payment_failed' }));
    const p2 = await prisma.payment.findUnique({ where: { stripeCheckoutSessionId: s2.session.id } });
    expect(p2.status).toBe('FAILED');
    expect(testOutbox.some((m) => m.to === s2.applicant.email && /not completed/i.test(m.subject))).toBe(true);
  });
});
