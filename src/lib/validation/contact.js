import { z } from 'zod';
import { emailField, optionalPhone, requiredText } from './common';

export const contactInquirySchema = z.object({
  name: requiredText('Name', 160),
  email: emailField,
  phone: optionalPhone,
  subject: requiredText('Subject', 200),
  message: requiredText('Message', 5000).refine((m) => m.length >= 10, 'Please provide a little more detail'),
  departmentId: z.string().max(40).optional().or(z.literal('')).transform((v) => v || undefined),
  // Honeypot: real users never see or fill this field
  website: z.string().max(0).optional().or(z.literal('')),
});

export const trackSchema = z.object({
  reference: requiredText('Reference number', 40),
  email: emailField,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth'),
});
