import { prisma } from './prisma';
import { ApiError, notFound } from './http';
import { computeFees } from './fees';
import { getStripe } from './stripe';
import { env } from './env';
import { receiptNumber } from './reference';
import { notifyUser } from './notify';
import { audit } from './audit';

/**
 * Creates (or reuses) a Stripe Checkout Session for an application.
 * Amounts come exclusively from server-side fee configuration.
 */
export async function createCheckout(user, app) {
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (app.status !== 'PAYMENT_PENDING') throw new ApiError(409, 'This application is not awaiting payment');

  const alreadyPaid = await prisma.payment.findFirst({ where: { applicationId: app.id, status: 'SUCCEEDED' } });
  if (alreadyPaid) throw new ApiError(409, 'This application has already been paid');

  const stripe = getStripe();

  // Reuse an open session rather than creating duplicates (prevents double charges)
  const pending = await prisma.payment.findFirst({
    where: { applicationId: app.id, status: 'PENDING', stripeCheckoutSessionId: { not: null } },
    orderBy: { createdAt: 'desc' },
  });
  if (pending) {
    const existing = await stripe.checkout.sessions.retrieve(pending.stripeCheckoutSessionId);
    if (existing.status === 'open' && existing.url) return { url: existing.url, paymentId: pending.id };
    if (existing.status === 'complete') {
      throw new ApiError(409, 'Your payment is being confirmed. Please refresh in a moment.');
    }
    await prisma.payment.update({ where: { id: pending.id }, data: { status: 'EXPIRED' } });
  }

  const fees = await computeFees(app.categoryId);
  if (fees.totalCents <= 0) throw new ApiError(400, 'No payment is required for this application');

  const payment = await prisma.payment.create({
    data: {
      applicationId: app.id,
      userId: user.id,
      amountCents: fees.totalCents,
      currency: fees.currency,
      lineItems: fees.lineItems,
      status: 'PENDING',
    },
  });

  const metadata = { paymentId: payment.id, applicationId: app.id, reference: app.referenceNumber };
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: app.id,
      line_items: fees.lineItems.map((li) => ({
        quantity: 1,
        price_data: {
          currency: fees.currency,
          unit_amount: li.amountCents,
          product_data: { name: li.name.slice(0, 250) },
        },
      })),
      metadata,
      payment_intent_data: { metadata, description: `Application ${app.referenceNumber}` },
      success_url: `${env.appUrl}/dashboard/payments/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appUrl}/dashboard/payments/cancelled?payment=${payment.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    { idempotencyKey: `checkout-${payment.id}` }
  );

  await prisma.payment.update({ where: { id: payment.id }, data: { stripeCheckoutSessionId: session.id } });
  return { url: session.url, paymentId: payment.id };
}

/** Applicant pressed "cancel" on Stripe: expire the session so it can't be paid later. */
export async function cancelCheckout(user, paymentId) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== user.id) throw notFound('Payment not found');
  if (payment.status !== 'PENDING') return payment;
  if (payment.stripeCheckoutSessionId) {
    try {
      await getStripe().checkout.sessions.expire(payment.stripeCheckoutSessionId);
    } catch (err) {
      // Already completed/expired sessions cannot be expired; the webhook is authoritative.
      const session = await getStripe().checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
      if (session.status === 'complete') return payment;
    }
  }
  return prisma.payment.updateMany({
    where: { id: payment.id, status: 'PENDING' },
    data: { status: 'CANCELED', failureReason: 'Cancelled by applicant' },
  });
}

// ── Webhooks ────────────────────────────────────────────────────────────────

/**
 * Processes a VERIFIED Stripe event exactly once. The event id is recorded in the
 * same database transaction as its effects, so a failure rolls both back and
 * Stripe's retry will be processed cleanly; a replay is ignored.
 */
export async function handleStripeEvent(event) {
  const followUps = [];
  const result = await prisma.$transaction(async (tx) => {
    const inserted = await tx.$executeRaw`
      INSERT INTO "StripeEvent" ("id", "type", "processedAt") VALUES (${event.id}, ${event.type}, NOW())
      ON CONFLICT ("id") DO NOTHING`;
    if (inserted === 0) return { duplicate: true };

    const obj = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        if (obj.payment_status === 'paid') await markPaid(tx, obj, event, followUps);
        else await logTx(tx, obj, event, 'awaiting_async_payment');
        break;
      case 'checkout.session.async_payment_failed':
        await markFailed(tx, obj, event, 'FAILED', 'Payment failed', followUps);
        break;
      case 'checkout.session.expired':
        await markFailed(tx, obj, event, 'EXPIRED', 'Checkout session expired', []);
        break;
      default:
        break; // Unhandled event types are acknowledged and ignored
    }
    return { duplicate: false };
  });
  for (const fn of followUps) await fn();
  return result;
}

async function findPaymentForSession(tx, session) {
  const byId = session.metadata?.paymentId
    ? await tx.payment.findUnique({ where: { id: session.metadata.paymentId } })
    : null;
  const payment = byId ?? (await tx.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } }));
  if (!payment) return null;
  // The session must be the one we created for this payment
  if (payment.stripeCheckoutSessionId && payment.stripeCheckoutSessionId !== session.id) return null;
  return payment;
}

async function logTx(tx, session, event, status) {
  const payment = await findPaymentForSession(tx, session);
  if (!payment) return null;
  await tx.paymentTransaction.create({
    data: { paymentId: payment.id, stripeEventId: event.id, eventType: event.type, amountCents: session.amount_total ?? null, status },
  });
  return payment;
}

async function markPaid(tx, session, event, followUps) {
  const payment = await findPaymentForSession(tx, session);
  if (!payment) {
    console.warn('[stripe] completed session with no matching payment', session.id);
    return;
  }
  await tx.paymentTransaction.create({
    data: { paymentId: payment.id, stripeEventId: event.id, eventType: event.type, amountCents: session.amount_total, status: session.payment_status },
  });
  if (payment.status === 'SUCCEEDED') return; // already confirmed

  if (session.amount_total !== payment.amountCents || session.currency !== payment.currency) {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: 'Amount mismatch — manual review required' },
    });
    followUps.push(() =>
      audit({ action: 'payment.amount_mismatch', entityType: 'Payment', entityId: payment.id, metadata: { expected: payment.amountCents, received: session.amount_total } })
    );
    return;
  }

  const receipt = receiptNumber();
  const updated = await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCEEDED',
      paidAt: new Date(),
      receiptNumber: receipt,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
      failureReason: null,
    },
    include: { application: true, user: true },
  });

  const moved = await tx.application.updateMany({
    where: { id: payment.applicationId, status: 'PAYMENT_PENDING' },
    data: { status: 'PAYMENT_CONFIRMED' },
  });
  if (moved.count === 1) {
    await tx.statusHistory.create({
      data: { applicationId: payment.applicationId, fromStatus: 'PAYMENT_PENDING', toStatus: 'PAYMENT_CONFIRMED', publicNote: `Payment received (receipt ${receipt})` },
    });
  }

  followUps.push(() =>
    notifyUser(updated.user, {
      title: `Payment confirmed for ${updated.application.referenceNumber}`,
      body: `Receipt ${receipt}. Your application will now be reviewed.`,
      link: `/dashboard/payments`,
      email: {
        template: 'paymentSucceeded',
        data: { reference: updated.application.referenceNumber, receipt, amount: updated.amountCents, currency: updated.currency },
      },
    })
  );
}

async function markFailed(tx, session, event, status, reason, followUps) {
  const payment = await logTx(tx, session, event, status.toLowerCase());
  if (!payment || payment.status !== 'PENDING') return;
  const updated = await tx.payment.update({
    where: { id: payment.id },
    data: { status, failureReason: reason },
    include: { application: true, user: true },
  });
  followUps.push(() =>
    notifyUser(updated.user, {
      title: `Payment not completed for ${updated.application.referenceNumber}`,
      body: 'Your payment could not be completed. You can try again from your dashboard.',
      link: `/dashboard/applications/${updated.applicationId}`,
      email: { template: 'paymentFailed', data: { reference: updated.application.referenceNumber } },
    })
  );
}
