'use client';

import { AlertCircle } from 'lucide-react';

export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/**
 * Accessible form field bound to react-hook-form. Label, hint and error are
 * associated with the control via htmlFor / aria-describedby / aria-invalid.
 */
export function Field({ form, name, label, type = 'text', hint, required, options, rows = 4, autoComplete, idPrefix = 'f', ...rest }) {
  const { register, formState } = form;
  const error = getPath(formState.errors, name)?.message;
  const id = `${idPrefix}-${name.replace(/\./g, '-')}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    'aria-required': required ? 'true' : undefined,
    ...register(name),
    ...rest,
  };

  if (type === 'checkbox') {
    return (
      <div className="mb-5">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary-700" {...common} />
          <label htmlFor={id} className="text-sm text-ink">
            {label}
            {required && <span className="sr-only"> (required)</span>}
          </label>
        </div>
        {hint && <span id={`${id}-hint`} className="hint ml-8">{hint}</span>}
        {error && <FieldError id={`${id}-error`} message={error} className="ml-8" />}
      </div>
    );
  }

  return (
    <div className="mb-5">
      <label htmlFor={id} className="label">
        {label}
        {required ? <span className="text-accent-700" aria-hidden="true"> *</span> : <span className="font-normal text-slate-600"> (optional)</span>}
      </label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {type === 'select' ? (
        <select className="input" {...common}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="input" rows={rows} {...common} />
      ) : (
        <input type={type} className="input" autoComplete={autoComplete} {...common} />
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

export function FieldError({ id, message, className = '' }) {
  return (
    <p id={id} className={`field-error ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span><span className="sr-only">Error: </span>{message}</span>
    </p>
  );
}

/** Error summary shown at the top of a form after a failed submit (GOV.UK pattern). */
export function ErrorSummary({ errors, idPrefix = 'f', title = 'There is a problem' }) {
  const flat = [];
  const walk = (obj, prefix = '') => {
    for (const [k, v] of Object.entries(obj || {})) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v?.message && typeof v.message === 'string') flat.push([path, v.message]);
      else if (v && typeof v === 'object') walk(v, path);
    }
  };
  walk(errors);
  if (!flat.length) return null;
  return (
    <div role="alert" tabIndex={-1} className="mb-6 rounded border-2 border-accent-600 bg-white p-4">
      <h2 className="font-sans text-base font-bold text-accent-800">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {flat.map(([path, msg]) => (
          <li key={path}>
            <a href={`#${idPrefix}-${path.replace(/\./g, '-')}`} className="text-accent-800 underline">{msg}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
