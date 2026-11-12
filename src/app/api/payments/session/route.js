import { prisma } from '@/lib/prisma';
import { route, json, notFound } from '@/lib/http';
import { requireUser } from '@/lib/rbac';

/**
 * Lets the success page show the payment state. The state comes ONLY from our
 * database (updated by verified webhooks), never from the redirect itself.
 */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  const sessionId = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) throw notFound('Payment not found');
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    select: {
      id: true,
      userId: true,
      status: true,
      amountCents: true,
      currency: true,
      receiptNumber: true,
      applicationId: true,
      application: { select: { referenceNumber: true } },
    },
  });
  if (!payment || payment.userId !== user.id) throw notFound('Payment not found');
  const { userId, ...safe } = payment;
  return json({ payment: safe });
});
