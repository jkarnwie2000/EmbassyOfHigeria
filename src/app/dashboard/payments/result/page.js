import PaymentResult from '@/components/applications/PaymentResult';

export const metadata = { title: 'Payment status' };

export default async function PaymentResultPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold">Payment status</h1>
      <PaymentResult sessionId={typeof sp.session_id === 'string' ? sp.session_id : ''} />
    </div>
  );
}
