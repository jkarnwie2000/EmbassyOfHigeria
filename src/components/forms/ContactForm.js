'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { contactInquirySchema } from '@/lib/validation/contact';
import { apiFetch, applyServerErrors } from '@/lib/client/api';
import { Field, ErrorSummary } from '@/components/ui/fields';
import { Alert } from '@/components/ui';

export default function ContactForm({ departments, defaultDepartmentId, fixedDepartmentId }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const form = useForm({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: { departmentId: fixedDepartmentId || defaultDepartmentId || '', website: '' },
  });
  const { handleSubmit, formState, setError: setFieldError, reset } = form;

  const onSubmit = async (values) => {
    setError('');
    try {
      await apiFetch('/api/contact', { method: 'POST', body: values });
      setDone(true);
      reset();
    } catch (e) {
      setError(e.message);
      applyServerErrors(setFieldError, e.details);
    }
  };

  if (done) {
    return (
      <Alert type="success" title="Thank you — your inquiry has been sent">
        We have saved your inquiry and sent a confirmation to your email address. <button type="button" className="underline" onClick={() => setDone(false)}>Send another inquiry</button>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl">
      {formState.submitCount > 0 && <ErrorSummary errors={formState.errors} idPrefix="contact" />}
      {error && <Alert type="error" className="mb-5">{error}</Alert>}
      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field form={form} idPrefix="contact" name="name" label="Full name" required autoComplete="name" />
        <Field form={form} idPrefix="contact" name="email" label="Email address" type="email" required autoComplete="email" />
        <Field form={form} idPrefix="contact" name="phone" label="Phone number" type="tel" autoComplete="tel" />
        {fixedDepartmentId ? (
          <input type="hidden" {...form.register('departmentId')} />
        ) : (
          <Field form={form} idPrefix="contact" name="departmentId" label="Office" type="select" options={departments.map((d) => ({ value: d.id, label: d.name }))} hint="Leave blank for a general inquiry." />
        )}
      </div>
      <Field form={form} idPrefix="contact" name="subject" label="Subject" required />
      <Field form={form} idPrefix="contact" name="message" label="Message" type="textarea" rows={6} required />
      {/* Honeypot for bots — hidden from people and assistive technology */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...form.register('website')} />
      </div>
      <button type="submit" className="btn-primary" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        {formState.isSubmitting ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  );
}
