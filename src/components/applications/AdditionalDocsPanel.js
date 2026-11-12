'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { apiFetch } from '@/lib/client/api';
import { Alert } from '@/components/ui';
import DocumentUploader from './DocumentUploader';

const ADDITIONAL = { docType: 'ADDITIONAL', label: 'Additional documents', description: 'Upload the documents requested by the Embassy.', acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4, required: false };

export default function AdditionalDocsPanel({ applicationId, requests, requirements, documents }) {
  const router = useRouter();
  const [docs, setDocs] = useState(documents);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const byType = (t) => docs.filter((d) => d.docType === t);
  const update = (t) => (list) => setDocs((all) => [...all.filter((d) => d.docType !== t), ...list]);

  return (
    <section className="card border-orange-300" aria-labelledby="req-h">
      <h2 id="req-h" className="text-xl font-semibold">Additional documents requested</h2>
      <div className="mt-3 space-y-2">
        {requests.map((r) => <Alert key={r.id} type="warning" title="Message from the Embassy">{r.message}</Alert>)}
      </div>
      <p className="mt-4 text-sm text-slate-700">Upload new or replacement documents below, then confirm to return your application for review. Replaced documents remain on record for the Embassy.</p>
      <div className="mt-4 space-y-3">
        <DocumentUploader applicationId={applicationId} requirement={ADDITIONAL} documents={byType('ADDITIONAL')} canEdit multiple onChange={update('ADDITIONAL')} />
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-primary-700">Replace an existing document</summary>
          <div className="mt-3 space-y-3">
            {requirements.map((r) => <DocumentUploader key={r.docType} applicationId={applicationId} requirement={r} documents={byType(r.docType)} canEdit onChange={update(r.docType)} />)}
          </div>
        </details>
      </div>
      {error && <Alert type="error" className="mt-4">{error}</Alert>}
      <button
        type="button"
        className="btn-primary mt-5"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await apiFetch(`/api/applications/${applicationId}/resubmit`, { method: 'POST' });
            router.refresh();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        I have uploaded the requested documents
      </button>
    </section>
  );
}
