import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { GET as getApp, PATCH as saveApp } from '@/app/api/applications/[id]/route';
import { POST as submit } from '@/app/api/applications/[id]/submit/route';
import { POST as track } from '@/app/api/track/route';
import { testOutbox } from '@/lib/email';
import { makeReq, call, registerApplicant, passportForm, visaForm } from './helpers';
import { createDraft, uploadAllRequired, submittedApplication } from './flows';

describe('2. Passport application submission', () => {
  it('saves a draft, refuses incomplete submission, then submits with a reference number and email', async () => {
    const applicant = await registerApplicant();
    const { id, category } = await createDraft(applicant.cookie, 'PASSPORT_NEW');

    // Partial draft saves fine
    const partial = await call(saveApp, makeReq('PATCH', `/api/applications/${id}`, { cookie: applicant.cookie, body: { formData: { personal: { firstName: 'Ada' } } } }), { id });
    expect(partial.status).toBe(200);

    // Submission of an incomplete form is rejected server-side
    const incomplete = await call(submit, makeReq('POST', `/api/applications/${id}/submit`, { cookie: applicant.cookie }), { id });
    expect(incomplete.status).toBe(400);
    expect(Object.keys(incomplete.body.details)).toContain('personal.lastName');

    // Complete form but no documents → rejected
    await call(saveApp, makeReq('PATCH', `/api/applications/${id}`, { cookie: applicant.cookie, body: { formData: passportForm(applicant.email) } }), { id });
    const noDocs = await call(submit, makeReq('POST', `/api/applications/${id}/submit`, { cookie: applicant.cookie }), { id });
    expect(noDocs.status).toBe(400);
    expect(noDocs.body.details.documents).toContain('PASSPORT_PHOTO');

    await uploadAllRequired(applicant.cookie, id, category);
    const ok = await call(submit, makeReq('POST', `/api/applications/${id}/submit`, { cookie: applicant.cookie }), { id });
    expect(ok.status).toBe(200);
    expect(ok.body.application.referenceNumber).toMatch(/^HGR-P-\d{4}-[0-9A-Z]{6}$/);
    expect(ok.body.application.status).toBe('PAYMENT_PENDING');
    expect(ok.body.amountDueCents).toBeGreaterThan(0);

    const app = await prisma.application.findUnique({ where: { id }, include: { passportDetails: true, statusHistory: true } });
    expect(app.lastName).toBe('Tester');
    expect(app.passportDetails.placeOfBirth).toBe('Velmora, Higeria');
    expect(app.statusHistory.map((h) => h.toStatus)).toEqual(expect.arrayContaining(['DRAFT', 'SUBMITTED', 'PAYMENT_PENDING']));
    expect(testOutbox.some((m) => m.to === applicant.email && m.subject.includes(app.referenceNumber))).toBe(true);
    // Email must not leak personal details
    const mail = testOutbox.find((m) => m.subject.includes(app.referenceNumber));
    expect(mail.text).not.toContain('1990-04-12');

    // A submitted application cannot be edited or re-submitted
    const edit = await call(saveApp, makeReq('PATCH', `/api/applications/${id}`, { cookie: applicant.cookie, body: { formData: {} } }), { id });
    expect(edit.status).toBe(409);
    const again = await call(submit, makeReq('POST', `/api/applications/${id}/submit`, { cookie: applicant.cookie }), { id });
    expect(again.status).toBe(409);
  });

  it('rejects malformed draft payloads', async () => {
    const applicant = await registerApplicant();
    const { id } = await createDraft(applicant.cookie, 'PASSPORT_RENEWAL');
    const r = await call(saveApp, makeReq('PATCH', `/api/applications/${id}`, { cookie: applicant.cookie, body: { formData: { x: 'a'.repeat(5000) } } }), { id });
    expect(r.status).toBe(400);
  });
});

describe('3. Visa application submission', () => {
  it('submits a visa application and stores travel details', async () => {
    const { appId, reference } = await submittedApplication('VISA');
    expect(reference).toMatch(/^HGR-V-/);
    const app = await prisma.application.findUnique({ where: { id: appId }, include: { visaDetails: true } });
    expect(app.status).toBe('PAYMENT_PENDING');
    expect(app.visaDetails.passportNumber).toBe('G1234567');
    expect(app.nationality).toBe('Ghanaian');
  });

  it('validates travel dates and passport expiry', async () => {
    const applicant = await registerApplicant();
    const { id, category } = await createDraft(applicant.cookie, 'VISA_TOURIST');
    const form = visaForm(applicant.email);
    form.travel.departureDate = '2000-01-01';
    form.passport.expiryDate = '2001-01-01';
    await call(saveApp, makeReq('PATCH', `/api/applications/${id}`, { cookie: applicant.cookie, body: { formData: form } }), { id });
    await uploadAllRequired(applicant.cookie, id, category);
    const r = await call(submit, makeReq('POST', `/api/applications/${id}/submit`, { cookie: applicant.cookie }), { id });
    expect(r.status).toBe(400);
    expect(r.body.details['travel.departureDate']).toBeTruthy();
    expect(r.body.details['passport.expiryDate']).toBeTruthy();
  });
});

describe('8. Application status tracking', () => {
  it('requires reference + email + date of birth, and reveals only status', async () => {
    const { applicant, reference } = await submittedApplication('PASSPORT');
    const ok = await call(track, makeReq('POST', '/api/track', { body: { reference: reference.toLowerCase(), email: applicant.email, dateOfBirth: '1990-04-12' } }));
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('PAYMENT_PENDING');
    expect(JSON.stringify(ok.body)).not.toContain('Tester');

    const wrongDob = await call(track, makeReq('POST', '/api/track', { body: { reference, email: applicant.email, dateOfBirth: '1991-04-12' } }));
    expect(wrongDob.status).toBe(404);
    const wrongEmail = await call(track, makeReq('POST', '/api/track', { body: { reference, email: 'other@example.org', dateOfBirth: '1990-04-12' } }));
    expect(wrongEmail.status).toBe(404);
  });

  it('is rate limited', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.77' };
    let last;
    for (let i = 0; i < 11; i++) {
      last = await call(track, makeReq('POST', '/api/track', { headers, body: { reference: 'HGR-P-2026-XXXXXX', email: 'a@example.org', dateOfBirth: '1990-01-01' } }));
    }
    expect(last.status).toBe(429);
  });
});

describe('11. Unauthorized access prevention (applicant data)', () => {
  it("prevents an applicant from reading or modifying another applicant's application", async () => {
    const { appId } = await submittedApplication('PASSPORT');
    const intruder = await registerApplicant();
    const read = await call(getApp, makeReq('GET', `/api/applications/${appId}`, { cookie: intruder.cookie }), { id: appId });
    expect(read.status).toBe(404);
    const write = await call(saveApp, makeReq('PATCH', `/api/applications/${appId}`, { cookie: intruder.cookie, body: { formData: {} } }), { id: appId });
    expect(write.status).toBe(404);
    const anon = await call(getApp, makeReq('GET', `/api/applications/${appId}`), { id: appId });
    expect(anon.status).toBe(401);
  });
});
