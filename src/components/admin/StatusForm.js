'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/client/api';
import { Alert } from '@/components/ui';

export default function StatusForm({ applicationId, transitions }) {
  const router = useRouter();
  const [status, setStatus] = useState(transitions[0]?.value || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const needsNote = status === 'ADDITIONAL_DOCUMENTS_REQUIRED';

  return (
    <form
      className="mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (['REJECTED', 'APPROVED'].includes(status) && !confirm(`Confirm: mark this application as ${transitions.find((t) => t.value === status).label}?`)) return;
        setBusy(true);
        setMsg(null);
        try {
          await apiFetch(`/api/admin/applications/${applicationId}/status`, { method: 'PATCH', body: { status, publicNote: note || undefined } });
          setNote('');
          setMsg({ type: 'success', text: 'Status updated and applicant notified.' });
          router.refresh();
        } catch (err) {
          setMsg({ type: 'error', text: err.details?.publicNote || err.message });
        } finally {
          setBusy(false);
        }
      }}
    >
      {msg && <Alert type={msg.type} className="mb-3">{msg.text}</Alert>}
      <label htmlFor="new-status" className="label">New status</label>
      <select id="new-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        {transitions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <label htmlFor="public-note" className="label mt-3">{needsNote ? 'Documents required (sent to applicant)' : 'Message to applicant (optional)'}</label>
      <textarea id="public-note" className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} required={needsNote} aria-describedby="public-note-hint" />
      <span id="public-note-hint" className="mt-1 block text-xs text-slate-600">Visible to the applicant and included in their email. Do not include sensitive personal data.</span>
      <button type="submit" className="btn-primary mt-3 w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Update status</button>
    </form>
  );
}
