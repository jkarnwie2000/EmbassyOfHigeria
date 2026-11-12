'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/client/api';

export default function StartApplicationButton({ categoryId, label = 'Start application' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <button
        type="button"
        className="btn-primary w-full md:w-auto"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const { application } = await apiFetch('/api/applications', { method: 'POST', body: { categoryId } });
            router.push(`/dashboard/applications/${application.id}`);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {busy ? 'Starting…' : label}
      </button>
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
