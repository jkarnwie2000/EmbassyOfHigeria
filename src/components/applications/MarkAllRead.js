'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/client/api';

export default function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await apiFetch('/api/notifications', { method: 'POST', body: { all: true } }).catch(() => {});
        router.refresh();
        setBusy(false);
      }}
    >
      Mark all as read
    </button>
  );
}
