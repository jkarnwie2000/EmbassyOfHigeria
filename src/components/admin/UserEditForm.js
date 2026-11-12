'use client';

import ResourceForm from './ResourceForm';

/** Omits the password from the update unless a new one was typed. */
export default function UserEditForm({ userId, fields, defaults }) {
  return (
    <ResourceForm
      endpoint={`/api/admin/users/${userId}`}
      method="PATCH"
      fields={fields}
      defaults={defaults}
      wrap={(v) => {
        const { password, ...rest } = v;
        return password ? v : rest;
      }}
      successMessage="Account updated. The user must sign in again."
    />
  );
}
