'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordField } from '@/lib/validation/auth';
import { apiFetch, applyServerErrors } from '@/lib/client/api';
import { Field } from '@/components/ui/fields';
import { Alert } from '@/components/ui';

const schema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: passwordField, confirm: z.string() })
  .refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function ChangePasswordForm() {
  const [msg, setMsg] = useState(null);
  const form = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async ({ currentPassword, newPassword }) => {
    setMsg(null);
    try {
      await apiFetch('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } });
      setMsg({ type: 'success', text: 'Your password has been changed.' });
      form.reset();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
      applyServerErrors(form.setError, e.details);
    }
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {msg && <Alert type={msg.type} className="mb-5">{msg.text}</Alert>}
      <Field form={form} idPrefix="pw" name="currentPassword" label="Current password" type="password" required autoComplete="current-password" />
      <Field form={form} idPrefix="pw" name="newPassword" label="New password" type="password" required autoComplete="new-password" hint="At least 12 characters with upper-case, lower-case and a number." />
      <Field form={form} idPrefix="pw" name="confirm" label="Confirm new password" type="password" required autoComplete="new-password" />
      <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>Change password</button>
    </form>
  );
}
