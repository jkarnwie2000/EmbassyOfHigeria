'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search, CheckCircle2 } from 'lucide-react';
import { trackSchema } from '@/lib/validation/contact';
import { apiFetch } from '@/lib/client/api';
import { Field } from '@/components/ui/fields';
import { Alert, StatusBadge } from '@/components/ui';

export default function TrackForm() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const form = useForm({ resolver: zodResolver(trackSchema) });

  const onSubmit = async (values) => {
    setError('');
    setResult(null);
    try {
      setResult(await apiFetch('/api/track', { method: 'POST', body: values }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="card">
        <Field form={form} idPrefix="track" name="reference" label="Reference number" required hint="For example HGR-P-2026-AB12CD" autoComplete="off" />
        <Field form={form} idPrefix="track" name="email" label="Email address used on the application" type="email" required autoComplete="email" />
        <Field form={form} idPrefix="track" name="dateOfBirth" label="Applicant’s date of birth" type="date" required />
        <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
          Check status
        </button>
      </form>
      <div aria-live="polite">
        {error && <Alert type="error">{error}</Alert>}
        {result && (
          <div className="card">
            <p className="text-sm text-slate-600">{result.type === 'PASSPORT' ? 'Passport' : 'Visa'} application</p>
            <p className="font-mono text-lg font-semibold">{result.referenceNumber}</p>
            <p className="mt-3">Current status: <StatusBadge status={result.status} /></p>
            <h2 className="mt-6 font-sans text-base font-bold">History</h2>
            <ol className="mt-3 space-y-3 border-l-2 border-primary-200 pl-5">
              {result.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <CheckCircle2 className="absolute -left-[30px] top-0.5 h-5 w-5 bg-white text-primary-600" aria-hidden="true" />
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-sm text-slate-600">{new Date(t.at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
