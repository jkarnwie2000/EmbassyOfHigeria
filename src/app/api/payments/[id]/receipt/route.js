import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route, notFound } from '@/lib/http';
import { requireUser, hasPermission, PERMISSIONS } from '@/lib/rbac';
import { renderReceiptPdf } from '@/lib/receipt';

export const GET = route(async (req, { params }) => {
  const user = await requireUser(req);
  const payment = await prisma.payment.findUnique({
    where: { id: String(params.id).slice(0, 40) },
    include: { application: true, user: true },
  });
  const allowed = payment && (payment.userId === user.id || hasPermission(user, PERMISSIONS.PAYMENTS_VIEW));
  if (!allowed || payment.status !== 'SUCCEEDED' || !payment.receiptNumber) throw notFound('Receipt not found');
  const pdf = await renderReceiptPdf(payment);
  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${payment.receiptNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
});
