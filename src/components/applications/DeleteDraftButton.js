'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/client/api';

export default function DeleteDraftButton({ applicationId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-danger btn-sm"
      disabled={busy}
      onClick={async () => {
        if (!confirm('Delete this draft and any documents uploaded to it? This cannot be undone.')) return;
        setBusy(true);
        try {
          await apiFetch(`/api/applications/${applicationId}`, { method: 'DELETE' });
          router.push('/dashboard');
          router.refresh();
        } catch (e) {
          alert(e.message);
          setBusy(false);
        }
      }}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" /> {busy ? 'Deleting…' : 'Delete draft'}
    </button>
  );
}
