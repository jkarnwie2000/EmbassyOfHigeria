'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client/api';

export default function InquiryUpdateForm({ id, status: initialStatus, note: initialNote }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [msg, setMsg] = useState('');
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg('');
        try {
          await apiFetch(`/api/admin/inquiries/${id}`, { method: 'PATCH', body: { status, internalNote: note } });
          setMsg('Saved.');
          router.refresh();
        } catch (err) {
          setMsg(err.message);
        }
      }}
      className="grid gap-3 sm:grid-cols-[12rem_1fr]"
    >
      <div>
        <label htmlFor={`st-${id}`} className="label">Status</label>
        <select id={`st-${id}`} className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="NEW">New</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
        </select>
      </div>
      <div>
        <label htmlFor={`nt-${id}`} className="label">Internal note</label>
        <textarea id={`nt-${id}`} className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" className="btn-primary btn-sm">Save</button>
        <span role="status" className="text-sm">{msg}</span>
      </div>
    </form>
  );
}
