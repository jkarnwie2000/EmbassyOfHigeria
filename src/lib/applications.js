import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ApiError, flattenIssues, notFound } from './http';
import { schemaFor } from './validation/applications';
import { applicationReference } from './reference';
import { computeFees } from './fees';
import { notifyUser } from './notify';
import { STATUS_LABELS } from './email';
import { canAccessApplicationType, isStaff } from './rbac';

export const TYPE_LABELS = { PASSPORT: 'Passport', VISA: 'Visa' };

/** Statuses a staff member may move an application to, from each status. */
export const STAFF_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  PAYMENT_PENDING: ['REJECTED'],
  PAYMENT_CONFIRMED: ['UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED', 'REJECTED'],
  UNDER_REVIEW: ['ADDITIONAL_DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED'],
  ADDITIONAL_DOCUMENTS_REQUIRED: ['UNDER_REVIEW', 'REJECTED'],
  APPROVED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
  DRAFT: [],
};

/** Applicants may edit documents only in these states. */
export const APPLICANT_UPLOAD_STATES = new Set(['DRAFT', 'ADDITIONAL_DOCUMENTS_REQUIRED']);

/**
 * Loads an application the user is allowed to see. Applicants can only see their
 * own; staff are scoped by department. Returns 404 (not 403) to avoid leaking existence.
 */
export async function loadApplicationFor(user, id, include = {}) {
  if (typeof id !== 'string' || id.length > 40) throw notFound('Application not found');
  const app = await prisma.application.findUnique({ where: { id }, include });
  if (!app) throw notFound('Application not found');
  if (app.applicantId === user.id) return app;
  if (isStaff(user) && canAccessApplicationType(user, app.type)) return app;
  throw notFound('Application not found');
}

function denormalise(type, data) {
  const p = data?.personal ?? {};
  const toDate = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T00:00:00Z') : null);
  const str = (v, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const base = {
    firstName: str(p.firstName, 80),
    lastName: str(p.lastName, 80),
    email: str(data?.contact?.email, 254)?.toLowerCase() ?? null,
    dateOfBirth: toDate(p.dateOfBirth),
    nationality: type === 'PASSPORT' ? 'Higerian' : str(p.nationality, 100),
  };
  if (type === 'PASSPORT') {
    const c = data?.citizenship ?? {};
    return {
      base,
      details: {
        previousPassportNumber: str(c.previousPassportNumber, 30),
        placeOfBirth: [str(p.placeOfBirthCity), str(p.placeOfBirthCountry)].filter(Boolean).join(', ') || null,
        citizenshipBasis: str(c.citizenshipBasis, 30),
        countryOfResidence: str(data?.contact?.address?.country, 100),
      },
    };
  }
  const pp = data?.passport ?? {};
  const t = data?.travel ?? {};
  return {
    base,
    details: {
      passportNumber: str(pp.passportNumber, 30)?.toUpperCase() ?? null,
      passportCountry: str(pp.issuingCountry, 100),
      passportExpiry: toDate(pp.expiryDate),
      travelPurpose: str(t.purpose, 1000),
      arrivalDate: toDate(t.arrivalDate),
      departureDate: toDate(t.departureDate),
      entries: str(t.entries, 20),
    },
  };
}

export async function createDraft(user, categoryId) {
  const category = await prisma.applicationCategory.findFirst({ where: { id: categoryId, active: true } });
  if (!category) throw new ApiError(400, 'Please choose a valid application type');
  const openDrafts = await prisma.application.count({ where: { applicantId: user.id, status: 'DRAFT' } });
  if (openDrafts >= 10) throw new ApiError(400, 'You have too many draft applications. Please complete or delete some first.');
  return prisma.application.create({
    data: {
      type: category.type,
      categoryId: category.id,
      applicantId: user.id,
      formData: {},
      ...(category.type === 'PASSPORT' ? { passportDetails: { create: {} } } : { visaDetails: { create: {} } }),
      statusHistory: { create: { toStatus: 'DRAFT', changedById: user.id } },
    },
  });
}

export async function saveDraft(user, app, formData) {
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (app.status !== 'DRAFT') throw new ApiError(409, 'Only draft applications can be edited');
  const { base, details } = denormalise(app.type, formData);
  return prisma.application.update({
    where: { id: app.id },
    data: {
      formData,
      ...base,
      ...(app.type === 'PASSPORT'
        ? { passportDetails: { upsert: { create: details, update: details } } }
        : { visaDetails: { upsert: { create: details, update: details } } }),
    },
  });
}

export async function missingRequiredDocuments(app) {
  const requirements = await prisma.documentRequirement.findMany({
    where: { categoryId: app.categoryId, required: true },
    orderBy: { sortOrder: 'asc' },
  });
  const docs = await prisma.document.findMany({
    where: { applicationId: app.id, status: 'ACTIVE' },
    select: { docType: true },
  });
  const have = new Set(docs.map((d) => d.docType));
  return requirements.filter((r) => !have.has(r.docType));
}

export async function submitApplication(user, app) {
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (app.status !== 'DRAFT') throw new ApiError(409, 'This application has already been submitted');

  const parsed = schemaFor(app.type).safeParse(app.formData);
  if (!parsed.success) {
    throw new ApiError(400, 'Your application is incomplete. Please review the highlighted sections.', flattenIssues(parsed.error));
  }
  const missing = await missingRequiredDocuments(app);
  if (missing.length) {
    throw new ApiError(400, `Please upload the required documents: ${missing.map((m) => m.label).join(', ')}`, {
      documents: missing.map((m) => m.docType),
    });
  }

  const fees = await computeFees(app.categoryId);
  const { base, details } = denormalise(app.type, parsed.data);
  const nextStatus = fees.totalCents > 0 ? 'PAYMENT_PENDING' : 'PAYMENT_CONFIRMED';

  let updated;
  for (let attempt = 0; attempt < 5 && !updated; attempt++) {
    try {
      updated = await prisma.$transaction(async (tx) => {
        // Guard against double-submission races: only a DRAFT row can transition.
        const res = await tx.application.updateMany({
          where: { id: app.id, status: 'DRAFT' },
          data: {
            referenceNumber: applicationReference(app.type),
            status: nextStatus,
            submittedAt: new Date(),
            formData: parsed.data,
            ...base,
          },
        });
        if (res.count !== 1) throw new ApiError(409, 'This application has already been submitted');
        if (app.type === 'PASSPORT') {
          await tx.passportDetails.upsert({ where: { applicationId: app.id }, create: { applicationId: app.id, ...details }, update: details });
        } else {
          await tx.visaDetails.upsert({ where: { applicationId: app.id }, create: { applicationId: app.id, ...details }, update: details });
        }
        await tx.statusHistory.createMany({
          data: [
            { applicationId: app.id, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: user.id },
            ...(nextStatus !== 'SUBMITTED'
              ? [{ applicationId: app.id, fromStatus: 'SUBMITTED', toStatus: nextStatus, changedById: null }]
              : []),
          ],
        });
        return tx.application.findUnique({ where: { id: app.id } });
      });
    } catch (err) {
      // Retry only on the (astronomically unlikely) reference-number collision
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
      throw err;
    }
  }
  if (!updated) throw new Error('Could not allocate a reference number');

  await notifyUser(user, {
    title: `Application ${updated.referenceNumber} submitted`,
    body:
      fees.totalCents > 0
        ? 'Your application was received. Please complete payment so it can be reviewed.'
        : 'Your application was received and will be reviewed.',
    link: `/dashboard/applications/${updated.id}`,
    email: {
      template: 'applicationSubmitted',
      data: {
        reference: updated.referenceNumber,
        typeLabel: TYPE_LABELS[updated.type],
        amountDue: fees.totalCents,
        currency: fees.currency,
      },
    },
  });
  return { application: updated, fees };
}

/** Staff-initiated status change with transition checks, history, notification and email. */
export async function changeStatus(actor, app, toStatus, publicNote) {
  const allowed = STAFF_TRANSITIONS[app.status] || [];
  if (!allowed.includes(toStatus)) {
    throw new ApiError(400, `Cannot change status from ${STATUS_LABELS[app.status]} to ${STATUS_LABELS[toStatus] || toStatus}`);
  }
  if (toStatus === 'APPROVED') {
    const paid = await isFullyPaid(app);
    if (!paid) throw new ApiError(400, 'An application cannot be approved before payment is confirmed');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.application.updateMany({
      where: { id: app.id, status: app.status },
      data: {
        status: toStatus,
        ...(['APPROVED', 'REJECTED'].includes(toStatus) ? { decidedAt: new Date() } : {}),
      },
    });
    if (res.count !== 1) throw new ApiError(409, 'The application was changed by someone else. Please reload.');
    await tx.statusHistory.create({
      data: { applicationId: app.id, fromStatus: app.status, toStatus, publicNote: publicNote || null, changedById: actor.id },
    });
    if (toStatus === 'ADDITIONAL_DOCUMENTS_REQUIRED') {
      await tx.documentRequest.create({
        data: { applicationId: app.id, message: publicNote || 'Please upload the additional documents requested.', requestedById: actor.id },
      });
    }
    return tx.application.findUnique({ where: { id: app.id }, include: { applicant: true } });
  });

  const template = toStatus === 'ADDITIONAL_DOCUMENTS_REQUIRED' ? 'documentsRequested' : 'statusChanged';
  await notifyUser(updated.applicant, {
    title: `Application ${updated.referenceNumber}: ${STATUS_LABELS[toStatus]}`,
    body: publicNote || `Your application status changed to ${STATUS_LABELS[toStatus]}.`,
    link: `/dashboard/applications/${updated.id}`,
    email: {
      template,
      data: { reference: updated.referenceNumber, status: toStatus, note: publicNote, message: publicNote || 'Please sign in for details.' },
    },
  });
  return updated;
}

/** Applicant confirms that requested documents have been uploaded. */
export async function resubmitDocuments(user, app) {
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (app.status !== 'ADDITIONAL_DOCUMENTS_REQUIRED') throw new ApiError(409, 'No documents have been requested for this application');
  return prisma.$transaction(async (tx) => {
    const res = await tx.application.updateMany({
      where: { id: app.id, status: 'ADDITIONAL_DOCUMENTS_REQUIRED' },
      data: { status: 'UNDER_REVIEW' },
    });
    if (res.count !== 1) throw new ApiError(409, 'Application state changed. Please reload.');
    await tx.documentRequest.updateMany({ where: { applicationId: app.id, resolvedAt: null }, data: { resolvedAt: new Date() } });
    await tx.statusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: 'ADDITIONAL_DOCUMENTS_REQUIRED',
        toStatus: 'UNDER_REVIEW',
        publicNote: 'Additional documents submitted by applicant',
        changedById: user.id,
      },
    });
    return tx.application.findUnique({ where: { id: app.id } });
  });
}

export async function isFullyPaid(app) {
  const fees = await computeFees(app.categoryId);
  if (fees.totalCents === 0) return true;
  const paid = await prisma.payment.count({ where: { applicationId: app.id, status: 'SUCCEEDED' } });
  return paid > 0;
}
