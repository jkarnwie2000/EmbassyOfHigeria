import Link from 'next/link';
import { Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/auth/current-user';
import { formatMoney } from '@/lib/fees';
import { formatDateTime } from '@/lib/content';
import { StatusBadge, EmptyState } from '@/components/ui';

export const metadata = { title: 'Payments and receipts' };

export default async function PaymentsPage() {
  const user = await requirePageUser('/dashboard/payments');
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { application: { select: { id: true, referenceNumber: true, category: { select: { name: true } } } } },
  });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Payments and receipts</h1>
      <p className="mt-2 text-slate-700">Payments are confirmed only after our payment processor notifies us. Receipts are available for confirmed payments.</p>
      {payments.length === 0 ? <div className="mt-6"><EmptyState title="No payments yet" /></div> : (
        <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="table">
            <caption className="sr-only">Payment history</caption>
            <thead><tr><th scope="col">Date</th><th scope="col">Application</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Receipt</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap">{formatDateTime(p.paidAt || p.createdAt)}</td>
                  <td><Link href={`/dashboard/applications/${p.application.id}`}>{p.application.category.name}</Link><br /><span className="font-mono text-xs">{p.application.referenceNumber}</span></td>
                  <td>{formatMoney(p.amountCents, p.currency)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.status === 'SUCCEEDED' ? <a href={`/api/payments/${p.id}/receipt`} className="inline-flex items-center gap-1 font-semibold"><Download className="h-4 w-4" aria-hidden="true" />{p.receiptNumber}</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
