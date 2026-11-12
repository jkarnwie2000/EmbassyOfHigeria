import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { POST as registerRoute } from '@/app/api/auth/register/route';

export const ORIGIN = 'http://localhost:3000';
const randomIp = () => `10.${crypto.randomInt(255)}.${crypto.randomInt(255)}.${crypto.randomInt(255)}`;

export function makeReq(method, path, { body, cookie, headers = {}, form, origin = ORIGIN } = {}) {
  const h = { 'x-forwarded-for': randomIp(), ...headers };
  if (origin) h.origin = origin;
  if (cookie) h.cookie = cookie;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    payload = typeof body === 'string' ? body : JSON.stringify(body);
    h['content-type'] = 'application/json';
  }
  return new NextRequest(ORIGIN + path, { method, headers: h, body: payload });
}

export async function call(handler, req, params = {}) {
  const res = await handler(req, { params: Promise.resolve(params) });
  const type = res.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { status: res.status, body, res };
}

export const cookieFrom = (res) => {
  const set = res.headers.get('set-cookie') || '';
  const m = set.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return m ? `${SESSION_COOKIE}=${m[1]}` : null;
};

export const uniqueEmail = (p = 'user') => `${p}.${crypto.randomBytes(5).toString('hex')}@example.org`;
export const STRONG_PASSWORD = 'Correct-Horse-42';

export async function registerApplicant(overrides = {}) {
  const email = overrides.email || uniqueEmail();
  const { status, body, res } = await call(
    registerRoute,
    makeReq('POST', '/api/auth/register', {
      body: { firstName: 'Ada', lastName: 'Tester', email, password: STRONG_PASSWORD, confirmPassword: STRONG_PASSWORD, acceptTerms: true, ...overrides },
    })
  );
  if (status !== 201) throw new Error('register failed ' + JSON.stringify(body));
  return { email, cookie: cookieFrom(res), userId: body.user.id };
}

export async function createStaffUser({ role = 'STAFF', permissions = [], departments = [] } = {}) {
  const deptRecords = await prisma.department.findMany({ where: { slug: { in: departments } } });
  const user = await prisma.user.create({
    data: {
      email: uniqueEmail(role.toLowerCase()),
      passwordHash: await hashPassword(STRONG_PASSWORD),
      firstName: 'Staff',
      lastName: 'Member',
      role,
      permissions,
      departments: { create: deptRecords.map((d) => ({ departmentId: d.id })) },
    },
  });
  const { token } = await createSession(user);
  return { user, cookie: `${SESSION_COOKIE}=${token}` };
}

// ── Sample files ──────────────────────────────────────────────────────────

// Smallest valid 1x1 PNG
export const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082',
  'hex'
);
export const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1'
);
export const EVIL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/OpenAction<</S/JavaScript/JS(app.alert(1))>>>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1'
);

export function uploadForm(buffer, docType, filename = 'file.bin', type = 'application/octet-stream') {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), filename);
  form.append('docType', docType);
  return form;
}

// ── Valid form payloads ───────────────────────────────────────────────────

const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const contact = (email) => ({
  email,
  phone: '+1 202 555 0123',
  address: { line1: '1 Test Street', city: 'Washington', state: 'DC', postalCode: '20001', country: 'United States' },
});
const emergency = { fullName: 'Jane Contact', relationship: 'Sister', phone: '+1 202 555 0144' };
const declaration = { accurate: true, consent: true };

export const passportForm = (email) => ({
  personal: { firstName: 'Ada', lastName: 'Tester', dateOfBirth: '1990-04-12', sex: 'FEMALE', placeOfBirthCity: 'Velmora', placeOfBirthCountry: 'Higeria' },
  citizenship: { citizenshipBasis: 'BIRTH' },
  contact: contact(email),
  emergency,
  declaration,
});

export const visaForm = (email) => ({
  personal: { firstName: 'Ada', lastName: 'Tester', dateOfBirth: '1985-01-30', sex: 'FEMALE', placeOfBirthCountry: 'Ghana', nationality: 'Ghanaian', occupation: 'Engineer' },
  passport: { passportNumber: 'G1234567', issuingCountry: 'Ghana', issueDate: '2020-01-01', expiryDate: inDays(900) },
  travel: { purpose: 'Tourism', arrivalDate: inDays(30), departureDate: inDays(44), entries: 'SINGLE', previouslyVisited: 'NO' },
  accommodation: { type: 'HOTEL', name: 'Sample Hotel', address: 'Velmora' },
  contact: contact(email),
  emergency,
  declaration,
});

export async function categoryByCode(code) {
  return prisma.applicationCategory.findUnique({ where: { code }, include: { requirements: true } });
}
