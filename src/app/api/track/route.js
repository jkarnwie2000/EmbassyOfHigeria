import { prisma } from '@/lib/prisma';
import { route, readJson, json, ApiError } from '@/lib/http';
import { trackSchema } from '@/lib/validation/contact';
import { normaliseReference } from '@/lib/reference';
import { enforceRateLimit } from '@/lib/rate-limit';
import { STATUS_LABELS } from '@/lib/email';

const NOT_FOUND = 'No application matches the details provided. Check your reference number, email address and date of birth.';

/**
 * Public status lookup. Requires reference number + email + date of birth, and
 * returns only status information — never personal data.
 */
export const POST = route(async (req) => {
  await enforceRateLimit(req, 'track', { limit: 10, windowSeconds: 900 });
  const { reference, email, dateOfBirth } = await readJson(req, trackSchema);
  const app = await prisma.application.findUnique({
    where: { referenceNumber: normaliseReference(reference) },
    select: {
      referenceNumber: true,
      type: true,
      status: true,
      email: true,
      dateOfBirth: true,
      submittedAt: true,
      updatedAt: true,
      statusHistory: { orderBy: { createdAt: 'asc' }, select: { toStatus: true, createdAt: true } },
    },
  });
  const matches =
    app &&
    app.email?.toLowerCase() === email.toLowerCase() &&
    app.dateOfBirth?.toISOString().slice(0, 10) === dateOfBirth;
  if (!matches) throw new ApiError(404, NOT_FOUND);

  return json({
    referenceNumber: app.referenceNumber,
    type: app.type,
    status: app.status,
    statusLabel: STATUS_LABELS[app.status],
    submittedAt: app.submittedAt,
    lastUpdated: app.updatedAt,
    timeline: app.statusHistory
      .filter((h) => h.toStatus !== 'DRAFT')
      .map((h) => ({ status: h.toStatus, label: STATUS_LABELS[h.toStatus], at: h.createdAt })),
  });
});
