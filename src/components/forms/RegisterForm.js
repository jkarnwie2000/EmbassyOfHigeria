'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { registerSchema } from '@/lib/validation/auth';
import { apiFetch, applyServerErrors } from '@/lib/client/api';
import { Field, ErrorSummary } from '@/components/ui/fields';
import { Alert } from '@/components/ui';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const form = useForm({ resolver: zodResolver(registerSchema) });
  const onSubmit = async (values) => {
    setError('');
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: values });
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e.message);
      applyServerErrors(form.setError, e.details);
    }
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {form.formState.submitCount > 0 && <ErrorSummary errors={form.formState.errors} idPrefix="reg" />}
      {error && <Alert type="error" className="mb-5">{error}</Alert>}
      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field form={form} idPrefix="reg" name="firstName" label="First name" required autoComplete="given-name" />
        <Field form={form} idPrefix="reg" name="lastName" label="Last name" required autoComplete="family-name" />
      </div>
      <Field form={form} idPrefix="reg" name="email" label="Email address" type="email" required autoComplete="email" />
      <Field form={form} idPrefix="reg" name="phone" label="Phone number" type="tel" autoComplete="tel" />
      <Field form={form} idPrefix="reg" name="password" label="Password" type="password" required autoComplete="new-password" hint="At least 12 characters, including upper-case and lower-case letters and a number." />
      <Field form={form} idPrefix="reg" name="confirmPassword" label="Confirm password" type="password" required autoComplete="new-password" />
      <Field
        form={form}
        idPrefix="reg"
        name="acceptTerms"
        type="checkbox"
        required
        label={<>I understand this is a <a href="/disclaimer" target="_blank">demonstration portal</a> and I have read the <a href="/privacy" target="_blank">privacy notice</a>.</>}
      />
      <button type="submit" className="btn-primary w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
