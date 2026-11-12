'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Download } from 'lucide-react';
import { apiFetch } from '@/lib/client/api';
import { Alert } from '@/components/ui';

/**
 * Polls OUR server for the payment status. Arriving on this page proves nothing:
 * a payment is shown as confirmed only after the verified Stripe webhook updated it.
 */
export default function PaymentResult({ sessionId }) {
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) return setError('Missing payment reference.');
    let cancelled = false;
    let timer;
    const poll = async (n) => {
      try {
        const { payment: p } = await apiFetch(`/api/payments/session?session_id=${encodeURIComponent(sessionId)}`);
        if (cancelled) return;
        setPayment(p);
        setAttempts(n);
        if (p.status === 'PENDING' && n < 20) timer = setTimeout(() => poll(n + 1), Math.min(1500 * (n + 1), 6000));
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };
    poll(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  if (error) return <Alert type="error" className="mt-6" title="We could not find this payment">{error} <Link href="/dashboard/payments">View your payments</Link></Alert>;
  if (!payment) return <p className="mt-6 flex items-center gap-2" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Checking payment status…</p>;

  const appLink = <Link href={`/dashboard/applications/${payment.applicationId}`}>Return to application {payment.application.referenceNumber}</Link>;

  return (
    <div className="mt-6 space-y-4" aria-live="polite">
      {payment.status === 'SUCCEEDED' && (
        <Alert type="success" title="Payment confirmed">
          Receipt number <strong>{payment.receiptNumber}</strong>. A confirmation email has been sent.
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={`/api/payments/${payment.id}/receipt`} className="btn-secondary btn-sm"><Download className="h-4 w-4" aria-hidden="true" /> Download receipt</a>
            {appLink}
          </div>
        </Alert>
      )}
      {payment.status === 'PENDING' && (
        <Alert type="info" title={attempts >= 20 ? 'Payment is still being confirmed' : 'Confirming your payment…'}>
          {attempts >= 20
            ? 'This can take a few minutes. You will receive an email when it is confirmed. Please do not pay again.'
            : 'Please wait while we receive confirmation from the payment processor.'}
          <div className="mt-2">{appLink}</div>
        </Alert>
      )}
      {['FAILED', 'CANCELED', 'EXPIRED'].includes(payment.status) && (
        <Alert type="error" title="Payment not completed">No payment has been confirmed. {appLink} to try again.</Alert>
      )}
    </div>
  );
}
