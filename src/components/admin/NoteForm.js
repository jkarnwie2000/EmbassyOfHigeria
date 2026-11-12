'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client/api';

export default function NoteForm({ applicationId }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        setError('');
        try {
          await apiFetch(`/api/admin/applications/${applicationId}/notes`, { method: 'POST', body: { body } });
          setBody('');
          router.refresh();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="note" className="sr-only">New internal note</label>
      <textarea id="note" className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add an internal note…" />
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-secondary btn-sm mt-2" disabled={busy || !body.trim()}>Add note</button>
    </form>
  );
}
