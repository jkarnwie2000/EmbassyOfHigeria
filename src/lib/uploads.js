import crypto from 'node:crypto';
import { ApiError } from './http';

export const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

// Hard ceiling regardless of per-document configuration. Set UPLOAD_MAX_MB=4 on Vercel
// (its serverless functions reject request bodies above ~4.5 MB).
export const ABSOLUTE_MAX_BYTES = Math.min(Number(process.env.UPLOAD_MAX_MB) || 10, 10) * 1024 * 1024;

/** Identify the real file type from its leading bytes. Declared MIME/extension are ignored. */
export function sniffMime(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  return null;
}

// PDF features that can execute code or carry hidden payloads
const DANGEROUS_PDF = [
  /\/JavaScript\b/,
  /\/JS[\s/<(\[]/,
  /\/Launch\b/,
  /\/EmbeddedFile\b/,
  /\/RichMedia\b/,
  /\/SubmitForm\b/,
  /\/ImportData\b/,
];

// Markup that should never appear in an image (polyglot-file defence)
const IMAGE_POLYGLOT = /<script|<\?php|<html|<svg|<iframe|javascript:/i;

export function inspectFile(buf, { acceptedMime, maxBytes }) {
  if (!buf || buf.length === 0) throw new ApiError(400, 'The file is empty.');
  const limit = Math.min(maxBytes, ABSOLUTE_MAX_BYTES);
  if (buf.length > limit) {
    throw new ApiError(413, `The file is too large. Maximum size is ${Math.round(limit / 1048576)} MB.`);
  }
  const mime = sniffMime(buf);
  if (!mime) throw new ApiError(415, 'Unsupported file type. Please upload a JPEG, PNG, or PDF file.');
  if (!acceptedMime.includes(mime)) {
    const allowed = acceptedMime.map((m) => MIME_EXT[m].toUpperCase()).join(', ');
    throw new ApiError(415, `This document must be one of: ${allowed}.`);
  }
  const text = buf.toString('latin1');
  if (mime === 'application/pdf') {
    if (!/%%EOF\s*$/.test(text.slice(-1024))) throw new ApiError(400, 'The PDF file appears to be damaged.');
    if (DANGEROUS_PDF.some((re) => re.test(text))) {
      throw new ApiError(
        400,
        'This PDF contains active content (scripts, attachments or actions) and cannot be accepted. Please export or print it to a plain PDF and try again.'
      );
    }
    if (/\/Encrypt\b/.test(text)) {
      throw new ApiError(400, 'Password-protected PDFs cannot be accepted.');
    }
  } else {
    if (IMAGE_POLYGLOT.test(text)) throw new ApiError(400, 'This image file was rejected for security reasons.');
    if (mime === 'image/png' && !text.includes('IEND')) throw new ApiError(400, 'The PNG file appears to be damaged.');
  }
  return {
    mime,
    ext: MIME_EXT[mime],
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  };
}

export function sanitizeFilename(name) {
  const base = String(name || 'document').split(/[\\/]/).pop();
  // Strip control characters and anything outside a conservative set
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[^\w.\- ()]/g, '_').trim();
  return (cleaned || 'document').slice(0, 150);
}

export function newStorageKey(prefix, ext) {
  return `${prefix}/${crypto.randomUUID()}.${ext}`;
}

/** Reads one file field from a multipart request without trusting client metadata. */
export async function readUploadedFile(req, field = 'file') {
  const length = Number(req.headers.get('content-length') || 0);
  if (length > ABSOLUTE_MAX_BYTES + 64 * 1024) {
    throw new ApiError(413, 'The file is too large.');
  }
  let form;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, 'Expected a multipart/form-data upload.');
  }
  const file = form.get(field);
  if (!file || typeof file === 'string') throw new ApiError(400, 'No file was provided.');
  if (file.size > ABSOLUTE_MAX_BYTES) throw new ApiError(413, 'The file is too large.');
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, filename: sanitizeFilename(file.name), form };
}
