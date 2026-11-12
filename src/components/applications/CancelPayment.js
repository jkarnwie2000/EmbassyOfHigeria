'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/client/api';
import { Alert } from '@/components/ui';

export default function CancelPayment({ paymentId }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!paymentId) return setDone(true);
    // Expire the Stripe session so it cannot be completed later, then show the message.
    apiFetch(`/api/payments/${encodeURIComponent(paymentId)}/cancel`, { method: 'POST' }).catch(() => {}).finally(() => setDone(true));
  }, [paymentId]);
  return (
    <div className="mt-6" aria-live="polite">
      {done ? (
        <Alert type="warning" title="You cancelled the payment">
          No payment was taken. Your application has been saved and is awaiting payment. <Link href="/dashboard">Return to your dashboard</Link> to try again.
        </Alert>
      ) : (
        <p role="status">Cancelling…</p>
      )}
    </div>
  );
}
