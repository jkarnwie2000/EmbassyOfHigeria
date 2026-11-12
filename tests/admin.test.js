import crypto from 'node:crypto';
import Stripe from 'stripe';
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { POST as login } from '@/app/api/auth/login/route';
import { PATCH as setStatus } from '@/app/api/admin/applications/[id]/status/route';
import { POST as addNote } from '@/app/api/admin/applications/[id]/notes/route';
import { POST as createUser } from '@/app/api/admin/users/route';
import { PATCH as updateUser } from '@/app/api/admin/users/[id]/route';
import { POST as createDept } from '@/app/api/admin/departments/route';
import { PATCH as updateCategory } from '@/app/api/admin/categories/[id]/route';
import { PUT as putSettings } from '@/app/api/admin/settings/route';
import { POST as createAnnouncement } from '@/app/api/admin/announcements/route';
import { POST as contact } from '@/app/api/contact/route';
import { PATCH as updateInquiry } from '@/app/api/admin/inquiries/[id]/route';
import { GET as report } from '@/app/api/admin/payments/report/route';
import { POST as upload } from '@/app/api/applications/[id]/documents/route';
import { POST as resubmit } from '@/app/api/applications/[id]/resubmit/route';
import { POST as webhook } from '@/app/api/stripe/webhook/route';
import { handleStripeEvent } from '@/lib/payments';
import { testOutbox } from '@/lib/email';
import { makeReq, call, createStaffUser, registerApplicant, STRONG_PASSWORD, uploadForm, PDF } from './helpers';
import { submittedApplication } from './flows';

const status = (cookie, id, body) => call(setStatus, makeReq('PATCH', `/api/admin/applications/${id}/status`, { cookie, body }), { id });

/** Simulates a confirmed Stripe payment for an application (through the real webhook handler). */
async function markPaid(appId) {
  const app = await prisma.application.findUnique({ where: { id: appId }, include: { category: true } });
  const payment = await prisma.payment.create({
    data: { applicationId: appId, userId: app.applicantId, amountCents: app.category.feeCents, currency: 'usd', lineItems: [{ name: 'Fee', amountCents: app.category.feeCents }], stripeCheckoutSessionId: `cs_test_${crypto.randomBytes(8).toString('hex')}` },
  });
  await handleStripeEvent({
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    type: 'checkout.session.completed',
    data: { object: { id: payment.stripeCheckoutSessionId, payment_status: 'paid', amount_total: payment.amountCents, currency: 'usd', payment_intent: `pi_${crypto.randomBytes(8).toString('hex')}`, metadata: { paymentId: payment.id } } },
  });
}

describe('9. Administrator authentication', () => {
  it('staff sign in through the same secure login and are directed to the admin dashboard', async () => {
    const staff = await createStaffUser({ role: 'ADMIN' });
    const r = await call(login, makeReq('POST', '/api/auth/login', { body: { email: staff.user.email, password: STRONG_PASSWORD } }));
    expect(r.status).toBe(200);
    expect(r.body.redirectTo).toBe('/admin');
    expect(await prisma.auditLog.count({ where: { actorId: staff.user.id, action: 'auth.staff_login' } })).toBe(1);
  });

  it('deactivated staff lose access immediately', async () => {
    const admin = await createStaffUser({ role: 'ADMIN', });
    const staff = await createStaffUser({ permissions: ['applications.view'] });
    const r = await call(updateUser, makeReq('PATCH', `/api/admin/users/${staff.user.id}`, { cookie: admin.cookie, body: { active: false } }), { id: staff.user.id });
    expect(r.status).toBe(200);
    expect(await prisma.session.count({ where: { userId: staff.user.id } })).toBe(0);
  });
});

describe('10. Application review and status updates', () => {
  it('moves an application through review, document request, re-submission and approval', async () => {
    const { applicant, appId } = await submittedApplication('PASSPORT');
    const reviewer = await createStaffUser({ permissions: ['applications.view', 'applications.review'], departments: ['passport-and-immigration'] });

    // Cannot approve before payment
    expect((await status(reviewer.cookie, appId, { status: 'APPROVED' })).status).toBe(400);
    await markPaid(appId);

    expect((await status(reviewer.cookie, appId, { status: 'UNDER_REVIEW' })).status).toBe(200);
    // Document request requires a message
    expect((await status(reviewer.cookie, appId, { status: 'ADDITIONAL_DOCUMENTS_REQUIRED' })).status).toBe(400);
    expect((await status(reviewer.cookie, appId, { status: 'ADDITIONAL_DOCUMENTS_REQUIRED', publicNote: 'Please upload a clearer birth certificate.' })).status).toBe(200);
    expect(testOutbox.some((m) => m.to === applicant.email && /Additional documents/i.test(m.subject))).toBe(true);
    expect(await prisma.notification.count({ where: { userId: applicant.userId } })).toBeGreaterThan(1);

    // Applicant uploads and re-submits
    const up = await call(upload, makeReq('POST', `/api/applications/${appId}/documents`, { cookie: applicant.cookie, form: uploadForm(PDF, 'ADDITIONAL', 'extra.pdf') }), { id: appId });
    expect(up.status).toBe(201);
    const rs = await call(resubmit, makeReq('POST', `/api/applications/${appId}/resubmit`, { cookie: applicant.cookie }), { id: appId });
    expect(rs.body.application.status).toBe('UNDER_REVIEW');

    // Internal note (never shown to applicant)
    expect((await call(addNote, makeReq('POST', `/api/admin/applications/${appId}/notes`, { cookie: reviewer.cookie, body: { body: 'Verified documents.' } }), { id: appId })).status).toBe(201);

    expect((await status(reviewer.cookie, appId, { status: 'APPROVED', publicNote: 'Approved' })).status).toBe(200);
    expect((await status(reviewer.cookie, appId, { status: 'COMPLETED' })).status).toBe(200);
    // Invalid transition
    expect((await status(reviewer.cookie, appId, { status: 'UNDER_REVIEW' })).status).toBe(400);

    const history = await prisma.statusHistory.findMany({ where: { applicationId: appId }, orderBy: { createdAt: 'asc' } });
    expect(history.at(-1).toStatus).toBe('COMPLETED');
    expect(await prisma.auditLog.count({ where: { entityId: appId, action: 'application.status_changed' } })).toBe(4); // review, request, approve, complete
  });

  it('rejects an application', async () => {
    const { appId } = await submittedApplication('VISA');
    const admin = await createStaffUser({ role: 'ADMIN' });
    await markPaid(appId);
    const r = await status(admin.cookie, appId, { status: 'REJECTED', publicNote: 'Does not meet requirements.' });
    expect(r.status).toBe(200);
    expect((await prisma.application.findUnique({ where: { id: appId } })).decidedAt).toBeTruthy();
  });
});

describe('11. Unauthorized access prevention (staff / RBAC)', () => {
  it('blocks applicants and anonymous users from admin endpoints', async () => {
    const { appId } = await submittedApplication('PASSPORT');
    const applicant = await registerApplicant();
    expect((await status(applicant.cookie, appId, { status: 'UNDER_REVIEW' })).status).toBe(403);
    expect((await status(null, appId, { status: 'UNDER_REVIEW' })).status).toBe(401);
    expect((await call(report, makeReq('GET', '/api/admin/payments/report', { cookie: applicant.cookie }))).status).toBe(403);
  });

  it('enforces permissions and department scope for staff', async () => {
    const { appId } = await submittedApplication('PASSPORT');
    const viewOnly = await createStaffUser({ permissions: ['applications.view'], departments: ['passport-and-immigration'] });
    expect((await status(viewOnly.cookie, appId, { status: 'UNDER_REVIEW' })).status).toBe(403);
    const wrongDept = await createStaffUser({ permissions: ['applications.view', 'applications.review'], departments: ['visa-and-entry-permits'] });
    expect((await status(wrongDept.cookie, appId, { status: 'UNDER_REVIEW' })).status).toBe(404);
    const noContent = await createStaffUser({ permissions: ['applications.view'] });
    const dept = await call(createDept, makeReq('POST', '/api/admin/departments', { cookie: noContent.cookie, body: {} }));
    expect(dept.status).toBe(403);
  });

  it('limits which roles an admin can create; staff cannot escalate privileges', async () => {
    const admin = await createStaffUser({ role: 'ADMIN' });
    const body = (role) => ({ email: `new.${crypto.randomBytes(4).toString('hex')}@example.org`, firstName: 'N', lastName: 'U', role, permissions: ['content.manage'], password: STRONG_PASSWORD });
    expect((await call(createUser, makeReq('POST', '/api/admin/users', { cookie: admin.cookie, body: body('STAFF') }))).status).toBe(201);
    expect((await call(createUser, makeReq('POST', '/api/admin/users', { cookie: admin.cookie, body: body('SUPER_ADMIN') }))).status).toBe(403);
    const userMgr = await createStaffUser({ permissions: ['users.manage'] });
    expect((await call(createUser, makeReq('POST', '/api/admin/users', { cookie: userMgr.cookie, body: body('STAFF') }))).status).toBe(403);
  });
});

describe('Content, configuration and inquiries', () => {
  it('admins configure fees, content and announcements without code changes', async () => {
    const admin = await createStaffUser({ role: 'ADMIN' });
    const cat = await prisma.applicationCategory.findUnique({ where: { code: 'VISA_TRANSIT' } });
    const r = await call(updateCategory, makeReq('PATCH', `/api/admin/categories/${cat.id}`, { cookie: admin.cookie, body: { feeCents: 250 } }), { id: cat.id });
    expect(r.status).toBe(200);
    expect((await prisma.applicationCategory.findUnique({ where: { id: cat.id } })).feeCents).toBe(250);

    const bad = await call(putSettings, makeReq('PUT', '/api/admin/settings', { cookie: admin.cookie, body: { key: 'site', value: { address: '' } } }));
    expect(bad.status).toBe(400);

    const ann = await call(createAnnouncement, makeReq('POST', '/api/admin/announcements', {
      cookie: admin.cookie,
      body: { title: 'Test notice', slug: `test-${Date.now()}`, summary: 'Summary', body: 'Body', category: 'VISA_UPDATES', published: true },
    }));
    expect(ann.status).toBe(201);
    expect(ann.body.record.publishedAt).toBeTruthy();
  });

  it('saves contact inquiries to the database, notifies, and lets staff manage them', async () => {
    const dept = await prisma.department.findUnique({ where: { slug: 'consular-affairs' } });
    const r = await call(contact, makeReq('POST', '/api/contact', { body: { name: 'Visitor', email: 'visitor@example.org', subject: 'Question', message: 'I have a question about services.', departmentId: dept.id } }));
    expect(r.status).toBe(201);
    const inquiry = await prisma.contactInquiry.findUnique({ where: { id: r.body.id } });
    expect(inquiry.departmentId).toBe(dept.id);
    expect(testOutbox.some((m) => m.to === 'visitor@example.org')).toBe(true);

    const consular = await createStaffUser({ permissions: ['inquiries.manage'], departments: ['consular-affairs'] });
    const other = await createStaffUser({ permissions: ['inquiries.manage'], departments: ['finance-and-accounts'] });
    expect((await call(updateInquiry, makeReq('PATCH', `/api/admin/inquiries/${inquiry.id}`, { cookie: other.cookie, body: { status: 'RESOLVED' } }), { id: inquiry.id })).status).toBe(404);
    expect((await call(updateInquiry, makeReq('PATCH', `/api/admin/inquiries/${inquiry.id}`, { cookie: consular.cookie, body: { status: 'RESOLVED' } }), { id: inquiry.id })).status).toBe(200);
  });

  it('exports a CSV payment report safe from formula injection', async () => {
    const admin = await createStaffUser({ role: 'ADMIN' });
    const r = await call(report, makeReq('GET', '/api/admin/payments/report', { cookie: admin.cookie }));
    expect(r.status).toBe(200);
    expect(r.body.toString()).toMatch(/^"Created","Paid","Status"/);
  });
});
