import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/http';
import { requireStaff, applicationScope, PERMISSIONS } from '@/lib/rbac';
import { audit } from '@/lib/audit';

// Neutralise spreadsheet formula injection and quote CSV values
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export const GET = route(async (req) => {
  const actor = await requireStaff(req, PERMISSIONS.PAYMENTS_VIEW);
  const sp = new URL(req.url).searchParams;
  const from = sp.get('from') && !Number.isNaN(Date.parse(sp.get('from'))) ? new Date(sp.get('from')) : new Date(Date.now() - 30 * 864e5);
  const to = sp.get('to') && !Number.isNaN(Date.parse(sp.get('to'))) ? new Date(sp.get('to') + 'T23:59:59Z') : new Date();
  const status = ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED', 'REFUNDED'].includes(sp.get('status')) ? sp.get('status') : undefined;

  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: from, lte: to }, ...(status ? { status } : {}), application: applicationScope(actor) },
    include: { application: { select: { referenceNumber: true, type: true } } },
    orderBy: { createdAt: 'asc' },
    take: 10000,
  });

  const header = ['Created', 'Paid', 'Status', 'Receipt', 'Application', 'Type', 'Amount', 'Currency', 'Stripe reference'];
  const rows = payments.map((p) => [
    p.createdAt.toISOString(),
    p.paidAt?.toISOString() ?? '',
    p.status,
    p.receiptNumber ?? '',
    p.application.referenceNumber ?? '',
    p.application.type,
    (p.amountCents / 100).toFixed(2),
    p.currency.toUpperCase(),
    p.stripePaymentIntentId ?? p.stripeCheckoutSessionId ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  await audit({ actor, action: 'payments.report_exported', metadata: { from, to, status, count: payments.length }, req });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payments-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
