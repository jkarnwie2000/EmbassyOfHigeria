import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { handleStripeEvent } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook endpoint. The signature is verified against the RAW request body;
 * unsigned or tampered events are rejected. This is the only place a payment can
 * be marked as successful.
 */
export async function POST(req) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = constructWebhookEvent(raw, signature);
  } catch (err) {
    console.warn('[stripe] webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (err) {
    console.error('[stripe] webhook processing failed', event.id, err);
    // 500 tells Stripe to retry; the event was not recorded, so the retry is processed cleanly.
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
