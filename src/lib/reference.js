import crypto from 'node:crypto';

// Crockford-style alphabet: no I, L, O, U to avoid transcription errors
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function randomCode(length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % 32];
  return out;
}

export function applicationReference(type) {
  const prefix = type === 'PASSPORT' ? 'P' : 'V';
  return `HGR-${prefix}-${new Date().getUTCFullYear()}-${randomCode(6)}`;
}

export function receiptNumber() {
  return `RCPT-${new Date().getUTCFullYear()}-${randomCode(8)}`;
}

export function normaliseReference(input) {
  return String(input || '').trim().toUpperCase().replace(/\s+/g, '');
}
