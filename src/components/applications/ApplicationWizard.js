'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft, ArrowRight, Send, Pencil } from 'lucide-react';
import { sectionsFor, SECTION_TITLES } from '@/lib/validation/applications';
import { FIELDS } from '@/lib/forms/fields';
import { apiFetch } from '@/lib/client/api';
import { Field, ErrorSummary } from '@/components/ui/fields';
import { Alert } from '@/components/ui';
import DocumentUploader from './DocumentUploader';

const ADDITIONAL_REQ = { docType: 'ADDITIONAL', label: 'Additional supporting documents', description: 'Any other documents that support your application.', acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4, required: false };

export default function ApplicationWizard({ application, requirements, initialDocuments, fees }) {
  const router = useRouter();
  const type = application.type;
  const sections = sectionsFor(type);
  const formSections = Object.keys(sections).filter((k) => k !== 'declaration');
  const steps = [...formSections, 'documents', 'review'];

  const [data, setData] = useState(application.formData || {});
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState(initialDocuments);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [serverDetails, setServerDetails] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const save = async (next) => {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/applications/${application.id}`, { method: 'PATCH', body: { formData: next } });
      setSavedAt(new Date());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const docsByType = useMemo(() => {
    const m = {};
    for (const d of docs) (m[d.docType] ||= []).push(d);
    return m;
  }, [docs]);
  const missingDocs = requirements.filter((r) => r.required && !docsByType[r.docType]?.length);

  const current = steps[step];
  const goTo = (i) => {
    setError('');
    setStep(i);
    window.scrollTo({ top: 0 });
  };

  return (
    <div>
      {/* Progress */}
      <nav aria-label="Application steps" className="mb-8">
        <ol className="flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && goTo(i)}
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i === step ? 'bg-primary-700 text-white' : i < step ? 'bg-primary-100 text-primary-800 hover:bg-primary-200' : 'bg-slate-100 text-slate-500'}`}
              >
                <span className="sr-only">Step {i + 1} of {steps.length}: </span>
                {s === 'documents' ? 'Documents' : s === 'review' ? 'Review & submit' : SECTION_TITLES[s]}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {current === 'documents' ? 'Upload documents' : current === 'review' ? 'Review and submit' : SECTION_TITLES[current]}
        </h2>
        <p className="text-sm text-slate-600" aria-live="polite">
          {saving ? 'Saving…' : savedAt ? `Draft saved at ${savedAt.toLocaleTimeString()}` : 'Your progress is saved as a draft.'}
        </p>
      </div>
      {error && <Alert type="error" className="mb-5" title={error}>{serverDetails && <ServerErrorList details={serverDetails} />}</Alert>}

      {formSections.includes(current) && (
        <SectionForm
          key={current}
          type={type}
          section={current}
          schema={sections[current]}
          defaults={data[current] || {}}
          saving={saving}
          isFirst={step === 0}
          onBack={async (values) => {
            const next = { ...data, [current]: values };
            setData(next);
            await save(next);
            goTo(step - 1);
          }}
          onSaveDraft={async (values) => {
            const next = { ...data, [current]: values };
            setData(next);
            await save(next);
          }}
          onNext={async (values) => {
            const next = { ...data, [current]: values };
            setData(next);
            if (await save(next)) goTo(step + 1);
          }}
        />
      )}

      {current === 'documents' && (
        <div>
          <p className="mb-5 text-slate-700">Upload clear, complete, unedited copies. Accepted formats are shown for each document. Files are stored privately and only Embassy staff handling your application can view them.</p>
          <div className="space-y-4">
            {requirements.map((r) => (
              <DocumentUploader key={r.docType} applicationId={application.id} requirement={r} documents={docsByType[r.docType] || []} canEdit canRemove onChange={(list) => setDocs((all) => [...all.filter((d) => d.docType !== r.docType), ...list])} />
            ))}
            <DocumentUploader applicationId={application.id} requirement={ADDITIONAL_REQ} documents={docsByType.ADDITIONAL || []} canEdit canRemove multiple onChange={(list) => setDocs((all) => [...all.filter((d) => d.docType !== 'ADDITIONAL'), ...list])} />
          </div>
          {missingDocs.length > 0 && <Alert type="info" className="mt-5">Still required: {missingDocs.map((m) => m.label).join(', ')}.</Alert>}
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={() => goTo(step - 1)}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
            <button type="button" className="btn-primary" disabled={missingDocs.length > 0} onClick={() => goTo(step + 1)}>Continue to review <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {current === 'review' && (
        <ReviewStep
          type={type}
          data={data}
          docs={docs}
          requirements={requirements}
          fees={fees}
          formSections={formSections}
          onEdit={(s) => goTo(formSections.indexOf(s))}
          onEditDocs={() => goTo(steps.indexOf('documents'))}
          onBack={() => goTo(step - 1)}
          onSubmit={async (declaration) => {
            const next = { ...data, declaration };
            setData(next);
            setServerDetails(null);
            if (!(await save(next))) return;
            try {
              await apiFetch(`/api/applications/${application.id}/submit`, { method: 'POST' });
              router.replace(`/dashboard/applications/${application.id}?submitted=1`);
              router.refresh();
            } catch (e) {
              setError(e.message);
              setServerDetails(e.details);
              window.scrollTo({ top: 0 });
            }
          }}
        />
      )}
    </div>
  );
}

function ServerErrorList({ details }) {
  const entries = Object.entries(details || {}).filter(([k]) => k !== 'documents');
  if (!entries.length) return null;
  return (
    <ul className="mt-2 list-disc pl-5">
      {entries.map(([k, v]) => <li key={k}><strong>{SECTION_TITLES[k.split('.')[0]] || k}:</strong> {v}</li>)}
    </ul>
  );
}

function SectionForm({ type, section, schema, defaults, saving, isFirst, onBack, onNext, onSaveDraft }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: defaults, mode: 'onTouched' });
  const fields = FIELDS[type][section];
  const idPrefix = `app-${section}`;
  return (
    <form onSubmit={form.handleSubmit(onNext)} noValidate>
      {form.formState.submitCount > 0 && <ErrorSummary errors={form.formState.errors} idPrefix={idPrefix} />}
      <p className="mb-5 text-sm text-slate-600">Fields marked <span className="text-accent-700">*</span> are required.</p>
      <div className="grid gap-x-6 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.half ? '' : 'md:col-span-2'}>
            <Field form={form} idPrefix={idPrefix} {...f} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {!isFirst && (
          <button type="button" className="btn-secondary" disabled={saving} onClick={() => onBack(form.getValues())}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving || form.formState.isSubmitting}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          Save and continue
        </button>
        <button type="button" className="btn-ghost" disabled={saving} onClick={() => onSaveDraft(form.getValues())}>
          <Save className="h-4 w-4" aria-hidden="true" /> Save draft
        </button>
      </div>
    </form>
  );
}

const display = (v) => {
  if (v === undefined || v === null || v === '') return '—';
  if (v === true) return 'Yes';
  if (v === 'FEMALE') return 'Female';
  if (v === 'MALE') return 'Male';
  return String(v);
};

function ReviewStep({ type, data, docs, requirements, fees, formSections, onEdit, onEditDocs, onBack, onSubmit }) {
  const declSchema = sectionsFor(type).declaration;
  const form = useForm({ resolver: zodResolver(declSchema), defaultValues: data.declaration || {} });
  const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
  const reqLabel = (t) => requirements.find((r) => r.docType === t)?.label || 'Additional document';

  return (
    <div>
      <p className="mb-6 text-slate-700">Check your answers carefully. After submission you will not be able to change them.</p>
      {formSections.map((s) => (
        <section key={s} className="mb-6 rounded border border-slate-200" aria-labelledby={`rev-${s}`}>
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
            <h3 id={`rev-${s}`} className="font-sans text-base font-bold">{SECTION_TITLES[s]}</h3>
            <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(s)}><Pencil className="h-4 w-4" aria-hidden="true" /> Change<span className="sr-only"> {SECTION_TITLES[s]}</span></button>
          </div>
          <dl className="grid gap-x-6 px-4 py-3 sm:grid-cols-2">
            {FIELDS[type][s].map((f) => (
              <div key={f.name} className="py-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">{f.label}</dt>
                <dd className="break-words text-ink">{display(f.options?.find((o) => o.value === get(data[s], f.name))?.label ?? get(data[s], f.name))}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <section className="mb-6 rounded border border-slate-200" aria-labelledby="rev-docs">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <h3 id="rev-docs" className="font-sans text-base font-bold">Documents</h3>
          <button type="button" className="btn-ghost btn-sm" onClick={onEditDocs}><Pencil className="h-4 w-4" aria-hidden="true" /> Change<span className="sr-only"> documents</span></button>
        </div>
        <ul className="px-4 py-3 text-sm">
          {docs.map((d) => <li key={d.id} className="py-1"><strong>{reqLabel(d.docType)}:</strong> {d.originalName}</li>)}
        </ul>
      </section>
      <section className="mb-6 rounded border border-slate-200 bg-primary-50 p-4" aria-labelledby="rev-fees">
        <h3 id="rev-fees" className="font-sans text-base font-bold">Fees payable after submission</h3>
        <ul className="mt-2 text-sm">
          {fees.lineItems.map((li, i) => <li key={i} className="flex justify-between gap-4 py-1"><span>{li.name}</span><span>{li.formatted}</span></li>)}
          <li className="mt-1 flex justify-between border-t border-primary-200 pt-2 font-semibold"><span>Total</span><span>{fees.totalFormatted}</span></li>
        </ul>
        {fees.isPlaceholder && <p className="mt-2 text-xs text-slate-700">Test amount — not an official fee.</p>}
      </section>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <h3 className="mb-3 text-xl font-semibold">Declaration</h3>
        {FIELDS[type].declaration.map((f) => <Field key={f.name} form={form} idPrefix="app-declaration" {...f} />)}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
          <button type="submit" className="btn-accent" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {form.formState.isSubmitting ? 'Submitting…' : 'Submit application'}
          </button>
        </div>
      </form>
    </div>
  );
}
