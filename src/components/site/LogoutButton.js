'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/client/api';

export default function LogoutButton({ className = 'btn-ghost' }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' });
        } finally {
          window.location.href = '/';
        }
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
