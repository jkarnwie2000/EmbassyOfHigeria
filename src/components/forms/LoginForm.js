'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { loginSchema } from '@/lib/validation/auth';
import { apiFetch } from '@/lib/client/api';
import { Field } from '@/components/ui/fields';
import { Alert } from '@/components/ui';

export default function LoginForm({ next }) {
  const [error, setError] = useState('');
  const form = useForm({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (values) => {
    setError('');
    try {
      const res = await apiFetch('/api/auth/login', { method: 'POST', body: values });
      // Staff always go to /admin; applicants may return to where they came from.
      window.location.href = res.redirectTo === '/admin' ? '/admin' : next || res.redirectTo;
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error && <Alert type="error" className="mb-5">{error}</Alert>}
      <Field form={form} idPrefix="login" name="email" label="Email address" type="email" required autoComplete="username" />
      <Field form={form} idPrefix="login" name="password" label="Password" type="password" required autoComplete="current-password" />
      <button type="submit" className="btn-primary w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
