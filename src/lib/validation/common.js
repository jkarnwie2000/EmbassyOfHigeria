import { z } from 'zod';

const trimmed = (max = 200) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const requiredText = (label, max = 200) => trimmed(max).min(1, `${label} is required`);
export const optionalText = (max = 200) => trimmed(max).optional().or(z.literal('')).transform((v) => v || undefined);

export const nameField = (label) =>
  requiredText(label, 80).regex(/^[\p{L}\p{M}'’ .-]+$/u, `${label} may only contain letters, spaces, apostrophes, periods and hyphens`);

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email address is required')
  .max(254)
  .email('Enter a valid email address');

export const phoneField = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .max(30)
  .regex(/^\+?[0-9 ()./-]{7,30}$/, 'Enter a valid phone number, including country code if outside the U.S.');

export const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .regex(/^(\+?[0-9 ()./-]{7,30})?$/, 'Enter a valid phone number')
  .optional()
  .transform((v) => v || undefined);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const dateField = (label) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(ISO_DATE, `${label} must be a valid date`)
    .refine((v) => !Number.isNaN(Date.parse(v + 'T00:00:00Z')), `${label} must be a valid date`);

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const pastDate = (label) => dateField(label).refine((v) => v <= todayIso(), `${label} cannot be in the future`);
export const futureDate = (label) => dateField(label).refine((v) => v >= todayIso(), `${label} must be today or later`);

export const birthDate = pastDate('Date of birth').refine((v) => v >= '1900-01-01', 'Enter a valid date of birth');

export const sexField = z.enum(['FEMALE', 'MALE'], { errorMap: () => ({ message: 'Select an option' }) });

export const addressSchema = z.object({
  line1: requiredText('Address line 1'),
  line2: optionalText(),
  city: requiredText('City', 100),
  state: optionalText(100),
  postalCode: optionalText(20),
  country: requiredText('Country', 100),
});

export const contactSchema = z.object({
  email: emailField,
  phone: phoneField,
  address: addressSchema,
});

export const emergencySchema = z.object({
  fullName: requiredText('Emergency contact name', 160),
  relationship: requiredText('Relationship', 80),
  phone: phoneField,
  email: z.union([emailField, z.literal('')]).optional().transform((v) => v || undefined),
});

export const declarationSchema = z.object({
  accurate: z.literal(true, { errorMap: () => ({ message: 'You must confirm this declaration' }) }),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must consent to the processing of your information' }) }),
});

/**
 * Drafts may be incomplete, so they are only checked for shape and size.
 * Full validation happens at submission.
 */
export function isSafeDraft(value, depth = 0) {
  if (depth > 5) return false;
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value === 'string') return value.length <= 4000;
  if (Array.isArray(value)) return value.length <= 50 && value.every((v) => isSafeDraft(v, depth + 1));
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return keys.length <= 60 && keys.every((k) => k.length <= 60 && !k.startsWith('__') && isSafeDraft(value[k], depth + 1));
  }
  return false;
}

export const draftSchema = z
  .record(z.any())
  .refine((v) => isSafeDraft(v), 'Draft contains unsupported data')
  .refine((v) => JSON.stringify(v).length <= 64 * 1024, 'Draft is too large');
