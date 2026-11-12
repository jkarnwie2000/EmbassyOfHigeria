import CancelPayment from '@/components/applications/CancelPayment';

export const metadata = { title: 'Payment cancelled' };

export default async function PaymentCancelledPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold">Payment cancelled</h1>
      <CancelPayment paymentId={typeof sp.payment === 'string' ? sp.payment : ''} />
    </div>
  );
}
