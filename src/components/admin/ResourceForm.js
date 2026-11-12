'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Save, Trash2, Upload } from 'lucide-react';
import { apiFetch, uploadWithProgress } from '@/lib/client/api';
import { getPath, FieldError } from '@/components/ui/fields';
import { Alert } from '@/components/ui';

/**
 * Config-driven admin form. Validation is authoritative on the server (Zod);
 * server field errors are mapped back onto the inputs.
 *
 * field.type: text | email | textarea | number | money | date | datetime | select |
 *             checkbox | checkboxes | lines | pairs | image
 */
function toFormValue(f, v) {
  switch (f.type) {
    case 'lines': return (v || []).join('\n');
    case 'pairs': return (v || []).map((o) => `${o[f.keys[0]]} | ${o[f.keys[1]]}`).join('\n');
    case 'money': return v == null ? '' : (v / 100).toFixed(2);
    case 'checkbox': return !!v;
    case 'checkboxes': return v || [];
    case 'datetime': return v ? new Date(v).toISOString().slice(0, 16) : '';
    case 'select': return v ?? '';
    default: return v ?? '';
  }
}

function fromFormValue(f, v) {
  switch (f.type) {
    case 'lines': return String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);
    case 'pairs':
      return String(v || '').split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
        const [a, ...rest] = line.split('|');
        return { [f.keys[0]]: a.trim(), [f.keys[1]]: rest.join('|').trim() };
      });
    case 'money': return Math.round(Number(v || 0) * 100);
    case 'number': return v === '' ? undefined : Number(v);
    case 'checkboxes': return Array.isArray(v) ? v : v ? [v] : [];
    case 'datetime': return v ? new Date(v).toISOString() : null;
    case 'select': return v === '' ? (f.nullable ? null : undefined) : v;
    case 'image': return v || null;
    default: return v;
  }
}

/**
 * redirectTo: optional path after save; "{id}" is replaced with the created record's id.
 * deleteRedirect: path to go to after a successful delete.
 * (Plain strings, because server components cannot pass functions to client components.)
 */
export default function ResourceForm({ endpoint, method = 'POST', fields, defaults = {}, submitLabel = 'Save', redirectTo, deleteEndpoint, deleteRedirect, deleteLabel = 'Delete', wrap, successMessage = 'Saved.', idPrefix = 'rf', columns = 2 }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const initial = Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, getPath(defaults, f.name))]));
  const form = useForm({ defaultValues: initial });
  const { register, handleSubmit, formState, setError, setValue, watch } = form;

  const onSubmit = async (raw) => {
    setMsg(null);
    const values = {};
    for (const f of fields) if (!f.readOnly) values[f.name] = fromFormValue(f, raw[f.name]);
    try {
      const res = await apiFetch(endpoint, { method, body: wrap ? wrap(values) : values });
      setMsg({ type: 'success', text: successMessage });
      if (redirectTo) router.push(redirectTo.replace('{id}', res?.record?.id ?? ''));
      router.refresh();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
      for (const [k, m] of Object.entries(e.details || {})) {
        const key = k.split('.')[0];
        if (fields.some((f) => f.name === key)) setError(key, { type: 'server', message: String(m) });
      }
    }
  };

  const onDelete = async () => {
    if (!confirm('Delete this item permanently?')) return;
    try {
      await apiFetch(deleteEndpoint, { method: 'DELETE' });
      if (deleteRedirect) router.push(deleteRedirect);
      router.refresh();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {msg && <Alert type={msg.type} className="mb-5">{msg.text}</Alert>}
      <div className={`grid gap-x-6 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
        {fields.map((f) => {
          const id = `${idPrefix}-${f.name}`;
          const error = formState.errors[f.name]?.message;
          const describedBy = [f.hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
          const common = { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy, disabled: f.readOnly };
          const wide = f.wide || ['textarea', 'lines', 'pairs', 'checkboxes', 'image'].includes(f.type);
          return (
            <div key={f.name} className={`mb-5 ${wide && columns === 2 ? 'md:col-span-2' : ''}`}>
              {f.type === 'checkbox' ? (
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-primary-700" {...common} {...register(f.name)} />
                  <label htmlFor={id} className="text-sm font-semibold">{f.label}</label>
                </div>
              ) : f.type === 'checkboxes' ? (
                <fieldset aria-describedby={describedBy}>
                  <legend className="label">{f.label}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {f.options.map((o) => (
                      <label key={o.value} className="flex items-start gap-2 text-sm">
                        <input type="checkbox" value={o.value} className="mt-0.5 h-4 w-4 accent-primary-700" {...register(f.name)} disabled={f.readOnly} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : f.type === 'image' ? (
                <ImageField id={id} label={f.label} value={watch(f.name)} onChange={(key) => setValue(f.name, key, { shouldDirty: true })} />
              ) : (
                <>
                  <label htmlFor={id} className="label">{f.label}{f.required && <span className="text-accent-700" aria-hidden="true"> *</span>}</label>
                  {f.type === 'select' ? (
                    <select className="input" {...common} {...register(f.name)}>
                      {f.nullable !== false && <option value="">{f.emptyLabel || '— None —'}</option>}
                      {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : ['textarea', 'lines', 'pairs'].includes(f.type) ? (
                    <textarea className="input" rows={f.rows || (f.type === 'textarea' ? 6 : 4)} {...common} {...register(f.name)} />
                  ) : (
                    <input
                      className="input"
                      type={f.type === 'money' ? 'number' : f.type === 'datetime' ? 'datetime-local' : f.type}
                      step={f.type === 'money' ? '0.01' : undefined}
                      min={f.type === 'money' || f.type === 'number' ? 0 : undefined}
                      {...common}
                      {...register(f.name, { required: f.required ? `${f.label} is required` : false })}
                    />
                  )}
                </>
              )}
              {f.hint && <span id={`${id}-hint`} className="mt-1 block text-xs text-slate-600">{f.hint}</span>}
              {error && <FieldError id={`${id}-err`} message={error} />}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {submitLabel}
        </button>
        {deleteEndpoint && (
          <button type="button" className="btn-danger" onClick={onDelete}><Trash2 className="h-4 w-4" aria-hidden="true" /> {deleteLabel}</button>
        )}
      </div>
    </form>
  );
}

function ImageField({ id, label, value, onChange }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  return (
    <div>
      <p className="label">{label}</p>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/media/${value.replace(/^public\//, '')}`} alt="" className="mb-2 h-32 rounded border object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError('');
            const fd = new FormData();
            fd.append('file', file);
            setProgress(0);
            try {
              const res = await uploadWithProgress('/api/admin/media', fd, setProgress);
              onChange(res.key);
            } catch (err) {
              setError(err.message);
            } finally {
              setProgress(null);
              e.target.value = '';
            }
          }}
        />
        <label htmlFor={id} className="btn-secondary btn-sm cursor-pointer"><Upload className="h-4 w-4" aria-hidden="true" /> {value ? 'Replace image' : 'Upload image'}</label>
        {value && <button type="button" className="btn-ghost btn-sm" onClick={() => onChange(null)}>Remove image</button>}
        {progress !== null && <span className="text-sm" role="status">Uploading… {progress}%</span>}
      </div>
      <span className="mt-1 block text-xs text-slate-600">JPEG or PNG, up to 5 MB. Use only images you are licensed to publish.</span>
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
