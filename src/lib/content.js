import { cache } from 'react';
import { prisma } from './prisma';
import { settings as defaults } from '../../prisma/seed-data.mjs';

/** Reads an admin-managed site setting, falling back to placeholder defaults. */
export const getSetting = cache(async (key) => {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return { ...defaults[key], ...(row?.value ?? {}) };
});

export const mediaUrl = (key) => (key ? `/api/media/${key.replace(/^public\//, '')}` : null);

export const ANNOUNCEMENT_LABELS = {
  EMBASSY_NEWS: 'Embassy News',
  CONSULAR_ANNOUNCEMENTS: 'Consular Announcements',
  VISA_UPDATES: 'Visa Updates',
  PASSPORT_UPDATES: 'Passport Updates',
  GOVERNMENT_NOTICES: 'Government Notices',
  COMMUNITY_EVENTS: 'Community Events',
};

export const FAQ_LABELS = {
  PASSPORT: 'Passport applications',
  VISA: 'Visa applications',
  DOCUMENTS: 'Required documents',
  FEES: 'Application fees',
  PROCESSING_TIMES: 'Processing times',
  PAYMENTS: 'Payment procedures',
  APPOINTMENTS: 'Embassy appointments',
  CONSULAR: 'Consular services',
  GENERAL: 'General',
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '';
