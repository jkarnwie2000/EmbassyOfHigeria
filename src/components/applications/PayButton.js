'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/client/api';

export default function PayButton({ applicationId, total }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <button
        type="button"
        className="btn-accent"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            // The server computes the amount; only the application id is sent.
            const { url } = await apiFetch('/api/payments/checkout', { method: 'POST', body: { applicationId } });
            window.location.assign(url);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
        {busy ? 'Redirecting to secure checkout…' : `Pay ${total} securely`}
      </button>
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
