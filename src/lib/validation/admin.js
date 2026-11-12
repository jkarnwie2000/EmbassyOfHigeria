import { z } from 'zod';
import { emailField, requiredText, optionalText } from './common';
import { passwordField } from './auth';
import { ALL_PERMISSIONS } from '../rbac';

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');

const lines = (max = 30) => z.array(z.string().trim().min(1).max(500)).max(max).default([]);

const safeHref = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v.startsWith('/') || /^https:\/\//.test(v), 'Links must start with / or https://');

export const departmentSchema = z.object({
  slug,
  name: requiredText('Name', 160),
  shortDescription: requiredText('Short description', 300),
  description: requiredText('Description', 6000),
  responsibilities: lines(),
  services: lines(),
  email: z.union([emailField, z.literal('')]).optional().transform((v) => v || null),
  phone: optionalText(40).transform((v) => v ?? null),
  officeHours: optionalText(500).transform((v) => v ?? null),
  location: optionalText(300).transform((v) => v ?? null),
  relatedLinks: z.array(z.object({ label: requiredText('Label', 120), href: safeHref })).max(12).default([]),
  handlesType: z.enum(['PASSPORT', 'VISA']).nullable().optional(),
  isPlaceholder: z.boolean().default(true),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const ANNOUNCEMENT_CATEGORIES = [
  'EMBASSY_NEWS',
  'CONSULAR_ANNOUNCEMENTS',
  'VISA_UPDATES',
  'PASSPORT_UPDATES',
  'GOVERNMENT_NOTICES',
  'COMMUNITY_EVENTS',
];

export const announcementSchema = z.object({
  title: requiredText('Title', 200),
  slug,
  summary: requiredText('Summary', 500),
  body: requiredText('Body', 20000),
  category: z.enum(ANNOUNCEMENT_CATEGORIES),
  imageKey: z
    .string()
    .regex(/^public\/[a-z0-9/_.-]+$/i)
    .nullable()
    .optional(),
  imageAlt: optionalText(250).transform((v) => v ?? null),
  published: z.boolean().default(false),
  publishedAt: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Invalid date'),
  important: z.boolean().default(false),
  departmentId: z.string().max(40).nullable().optional(),
});

export const FAQ_CATEGORIES = ['PASSPORT', 'VISA', 'DOCUMENTS', 'FEES', 'PROCESSING_TIMES', 'PAYMENTS', 'APPOINTMENTS', 'CONSULAR', 'GENERAL'];

export const faqSchema = z.object({
  question: requiredText('Question', 300),
  answer: requiredText('Answer', 5000),
  category: z.enum(FAQ_CATEGORIES),
  departmentId: z.string().max(40).nullable().optional(),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

const MIMES = ['image/jpeg', 'image/png', 'application/pdf'];

export const categorySchema = z.object({
  type: z.enum(['PASSPORT', 'VISA']),
  code: z.string().trim().min(2).max(40).regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits and underscores'),
  name: requiredText('Name', 120),
  description: requiredText('Description', 2000),
  eligibility: z.string().trim().max(4000).default(''),
  feeCents: z.coerce.number().int().min(0).max(10_000_00),
  currency: z.enum(['usd']).default('usd'),
  active: z.boolean().default(true),
  isPlaceholder: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const requirementSchema = z.object({
  docType: z.string().trim().min(2).max(40).regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits and underscores').refine((v) => v !== 'ADDITIONAL', 'Reserved name'),
  label: requiredText('Label', 120),
  description: z.string().trim().max(1000).default(''),
  required: z.boolean().default(true),
  acceptedMime: z.array(z.enum(MIMES)).min(1, 'Select at least one file type'),
  maxSizeMb: z.coerce.number().int().min(1).max(10),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const serviceFeeSchema = z.object({
  name: requiredText('Name', 120),
  description: z.string().trim().max(1000).default(''),
  amountCents: z.coerce.number().int().min(1).max(10_000_00),
  currency: z.enum(['usd']).default('usd'),
  appliesTo: z.enum(['PASSPORT', 'VISA']).nullable().optional(),
  categoryId: z.string().max(40).nullable().optional(),
  active: z.boolean().default(true),
});

export const inquiryUpdateSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  internalNote: z.string().trim().max(5000).optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED', 'COMPLETED']),
  publicNote: z.string().trim().max(2000).optional(),
}).refine((d) => d.status !== 'ADDITIONAL_DOCUMENTS_REQUIRED' || (d.publicNote && d.publicNote.length >= 5), {
  path: ['publicNote'],
  message: 'Describe which documents are required',
});

export const noteSchema = z.object({ body: requiredText('Note', 5000) });

export const userCreateSchema = z.object({
  email: emailField,
  firstName: requiredText('First name', 80),
  lastName: requiredText('Last name', 80),
  role: z.enum(['STAFF', 'ADMIN', 'SUPER_ADMIN']),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).default([]),
  departmentIds: z.array(z.string().max(40)).max(20).default([]),
  password: passwordField,
});

export const userUpdateSchema = z.object({
  role: z.enum(['STAFF', 'ADMIN', 'SUPER_ADMIN']).optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).optional(),
  departmentIds: z.array(z.string().max(40)).max(20).optional(),
  active: z.boolean().optional(),
  password: passwordField.optional(),
});

// ── Site settings (homepage, contact details, about page) ──────────────────

export const settingSchemas = {
  site: z.object({
    address: requiredText('Address', 300),
    phone: requiredText('Telephone', 60),
    fax: optionalText(60),
    email: requiredText('Email', 254),
    consularEmail: optionalText(254),
    emergencyPhone: requiredText('Emergency telephone', 60),
    emergencyNote: z.string().trim().max(1000).default(''),
    officeHours: requiredText('Office hours', 1000),
    consularHours: z.string().trim().max(1000).default(''),
    mapQuery: requiredText('Map search location', 200),
    isPlaceholder: z.boolean(),
  }),
  home: z.object({
    heroTitle: requiredText('Hero title', 200),
    heroSubtitle: requiredText('Hero subtitle', 500),
    heroImageKey: z.string().regex(/^public\/[a-z0-9/_.-]+$/i).nullable().optional(),
    heroImageAlt: z.string().trim().max(250).optional(),
    welcomeTitle: requiredText('Welcome title', 200),
    welcomeMessage: requiredText('Welcome message', 5000),
    ambassadorName: requiredText("Ambassador's name", 160),
    ambassadorTitle: requiredText("Ambassador's title", 200),
    ambassadorMessage: requiredText("Ambassador's message", 8000),
    ambassadorImageKey: z.string().regex(/^public\/[a-z0-9/_.-]+$/i).nullable().optional(),
    isPlaceholder: z.boolean(),
  }),
  about: z.object({
    history: requiredText('History', 12000),
    mission: requiredText('Mission', 6000),
    responsibilities: lines(),
    ambassadorProfile: requiredText('Ambassador profile', 8000),
    leadership: z.array(z.object({ name: requiredText('Name', 160), title: requiredText('Title', 200) })).max(30).default([]),
    diplomaticMission: requiredText('Diplomatic mission information', 6000),
    bilateralRelations: requiredText('Higeria–U.S. relations', 12000),
    isPlaceholder: z.boolean(),
  }),
};
