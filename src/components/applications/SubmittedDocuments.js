'use client';

import { Eye, FileText } from 'lucide-react';
import { openDocument } from './DocumentUploader';

export default function SubmittedDocuments({ documents, requirements, title = 'Submitted documents' }) {
  const label = (t) => requirements.find((r) => r.docType === t)?.label || 'Additional document';
  return (
    <section className="card" aria-labelledby="docs-h">
      <h2 id="docs-h" className="text-xl font-semibold">{title}</h2>
      {documents.length === 0 ? <p className="mt-2 text-sm text-slate-600">No documents.</p> : (
        <ul className="mt-3 divide-y divide-slate-100">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500" aria-hidden="true" /><strong>{label(d.docType)}</strong> <span className="break-all text-slate-600">{d.originalName}</span>{d.status && d.status !== 'ACTIVE' && <span className="text-xs text-slate-500">({d.status.toLowerCase()})</span>}</span>
              <button type="button" className="btn-ghost btn-sm" onClick={() => openDocument(d.id)}><Eye className="h-4 w-4" aria-hidden="true" /> View<span className="sr-only"> {d.originalName}</span></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
