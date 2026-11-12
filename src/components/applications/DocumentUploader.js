'use client';

import { useId, useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Trash2, Eye, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiFetch, uploadWithProgress } from '@/lib/client/api';

const EXT = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'application/pdf': 'PDF' };
const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Opens a document through a short-lived signed URL obtained from the server. */
export async function openDocument(id, inline = true) {
  const win = window.open('', '_blank', 'noopener');
  try {
    const { url } = await apiFetch(`/api/documents/${id}/url${inline ? '?inline=1' : ''}`);
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (e) {
    win?.close();
    alert(e.message);
  }
}

export default function DocumentUploader({ applicationId, requirement, documents, canEdit, canRemove, multiple = false, onChange }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const accept = requirement.acceptedMime.join(',');
  const maxBytes = requirement.maxSizeMb * 1024 * 1024;
  const hasDoc = documents.length > 0;

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    // Client-side checks are for convenience only; the server re-validates file content.
    if (!requirement.acceptedMime.includes(file.type)) {
      setError(`Please choose a ${requirement.acceptedMime.map((m) => EXT[m]).join(' or ')} file.`);
      return;
    }
    if (file.size > maxBytes) {
      setError(`This file is ${fmtSize(file.size)}. The maximum is ${requirement.maxSizeMb} MB.`);
      return;
    }
    if (file.type.startsWith('image/')) setPreview((old) => (old && URL.revokeObjectURL(old), URL.createObjectURL(file)));
    else setPreview(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('docType', requirement.docType);
    setProgress(0);
    try {
      const { document } = await uploadWithProgress(`/api/applications/${applicationId}/documents`, fd, setProgress);
      onChange(multiple ? [...documents, document] : [document]);
    } catch (e) {
      setError(e.message);
      setPreview(null);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (doc) => {
    if (!confirm(`Remove “${doc.originalName}”?`)) return;
    setError('');
    try {
      await apiFetch(`/api/applications/${applicationId}/documents/${doc.id}`, { method: 'DELETE' });
      onChange(documents.filter((d) => d.id !== doc.id));
      setPreview(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className={`rounded border p-4 ${hasDoc ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-300'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">
            {hasDoc && <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-label="Uploaded" />}
            {requirement.label}
            {requirement.required ? <span className="text-sm font-normal text-accent-700">(required)</span> : <span className="text-sm font-normal text-slate-600">(optional)</span>}
          </p>
          {requirement.description && <p className="mt-1 text-sm text-slate-700">{requirement.description}</p>}
          <p className="mt-1 text-xs text-slate-600">{requirement.acceptedMime.map((m) => EXT[m]).join(', ')} · max {requirement.maxSizeMb} MB</p>
        </div>
        {canEdit && (
          <div>
            <input ref={inputRef} id={inputId} type="file" accept={accept} className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} disabled={progress !== null} />
            <label htmlFor={inputId} className={`btn-secondary btn-sm cursor-pointer ${progress !== null ? 'pointer-events-none opacity-60' : ''}`}>
              {hasDoc && !multiple ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
              {hasDoc && !multiple ? 'Replace file' : 'Choose file'}
              <span className="sr-only"> for {requirement.label}</span>
            </label>
          </div>
        )}
      </div>

      {progress !== null && (
        <div className="mt-3" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-slate-700"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Uploading… {progress}%</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress for ${requirement.label}`}>
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && <p role="alert" className="field-error">{error}</p>}

      {(hasDoc || preview) && (
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`Preview of ${requirement.label}`} className="h-28 w-auto rounded border border-slate-200 object-contain" />
          )}
          <ul className="flex-1 space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-2 text-sm">
                {doc.mimeType === 'application/pdf' ? <FileText className="h-4 w-4 text-slate-600" aria-hidden="true" /> : <ImageIcon className="h-4 w-4 text-slate-600" aria-hidden="true" />}
                <span className="break-all font-medium">{doc.originalName}</span>
                <span className="text-slate-600">({fmtSize(doc.sizeBytes)})</span>
                <button type="button" className="btn-ghost btn-sm" onClick={() => openDocument(doc.id)}>
                  <Eye className="h-4 w-4" aria-hidden="true" /> View<span className="sr-only"> {doc.originalName}</span>
                </button>
                {canRemove && (
                  <button type="button" className="btn-ghost btn-sm text-accent-700" onClick={() => remove(doc)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove<span className="sr-only"> {doc.originalName}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
