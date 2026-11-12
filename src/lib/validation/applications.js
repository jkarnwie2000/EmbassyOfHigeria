import { z } from 'zod';
import {
  nameField,
  requiredText,
  optionalText,
  birthDate,
  sexField,
  contactSchema,
  emergencySchema,
  declarationSchema,
  dateField,
  futureDate,
  pastDate,
  todayIso,
} from './common';

// ── Passport ────────────────────────────────────────────────────────────────

export const passportSections = {
  personal: z.object({
    firstName: nameField('First name'),
    middleName: optionalText(80),
    lastName: nameField('Last name'),
    dateOfBirth: birthDate,
    sex: sexField,
    placeOfBirthCity: requiredText('Place of birth (city/town)', 100),
    placeOfBirthCountry: requiredText('Place of birth (country)', 100),
  }),
  citizenship: z.object({
    citizenshipBasis: z.enum(['BIRTH', 'DESCENT', 'NATURALIZATION', 'OTHER'], {
      errorMap: () => ({ message: 'Select how you hold Higerian citizenship' }),
    }),
    citizenshipDetails: optionalText(500),
    nationalIdNumber: optionalText(40),
    previousPassportNumber: optionalText(30),
    previousPassportIssueDate: z
      .union([pastDate('Previous passport issue date'), z.literal('')])
      .optional()
      .transform((v) => v || undefined),
  }),
  contact: contactSchema,
  emergency: emergencySchema,
  declaration: declarationSchema,
};

export const passportSchema = z.object(passportSections);

// ── Visa ────────────────────────────────────────────────────────────────────

export const visaSections = {
  personal: z.object({
    firstName: nameField('First name'),
    middleName: optionalText(80),
    lastName: nameField('Last name'),
    dateOfBirth: birthDate,
    sex: sexField,
    placeOfBirthCountry: requiredText('Country of birth', 100),
    nationality: requiredText('Nationality', 100),
    occupation: requiredText('Occupation', 120),
  }),
  passport: z
    .object({
      passportNumber: requiredText('Passport number', 30).regex(/^[A-Za-z0-9]{5,30}$/, 'Passport number may contain letters and digits only'),
      issuingCountry: requiredText('Issuing country', 100),
      issueDate: pastDate('Issue date'),
      expiryDate: dateField('Expiry date').refine((v) => v > todayIso(), 'Your passport must not be expired'),
    })
    .refine((p) => p.expiryDate > p.issueDate, { path: ['expiryDate'], message: 'Expiry date must be after the issue date' }),
  travel: z
    .object({
      purpose: requiredText('Purpose of travel', 1000),
      arrivalDate: futureDate('Intended arrival date'),
      departureDate: dateField('Intended departure date'),
      entries: z.enum(['SINGLE', 'MULTIPLE'], { errorMap: () => ({ message: 'Select number of entries' }) }),
      previouslyVisited: z.enum(['YES', 'NO'], { errorMap: () => ({ message: 'Select an option' }) }),
      travelHistory: optionalText(2000),
    })
    .refine((t) => t.departureDate >= t.arrivalDate, {
      path: ['departureDate'],
      message: 'Departure date must be on or after the arrival date',
    }),
  accommodation: z.object({
    type: z.enum(['HOTEL', 'PRIVATE_RESIDENCE', 'ORGANIZATION', 'OTHER'], {
      errorMap: () => ({ message: 'Select accommodation type' }),
    }),
    name: requiredText('Accommodation / host name', 160),
    address: requiredText('Accommodation address', 300),
    phone: optionalText(30),
  }),
  contact: contactSchema,
  emergency: emergencySchema,
  declaration: declarationSchema,
};

export const visaSchema = z.object(visaSections);

export const schemaFor = (type) => (type === 'PASSPORT' ? passportSchema : visaSchema);
export const sectionsFor = (type) => (type === 'PASSPORT' ? passportSections : visaSections);

export const SECTION_TITLES = {
  personal: 'Personal information',
  citizenship: 'Citizenship',
  passport: 'Passport details',
  travel: 'Travel plans',
  accommodation: 'Accommodation in Higeria',
  contact: 'Residential and contact information',
  emergency: 'Emergency contact',
  declaration: 'Declaration',
};
