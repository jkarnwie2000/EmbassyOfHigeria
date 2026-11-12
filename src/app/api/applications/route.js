import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { route, readJson, json } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { createDraft } from '@/lib/applications';
import { enforceRateLimit } from '@/lib/rate-limit';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  const applications = await prisma.application.findMany({
    where: { applicantId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      referenceNumber: true,
      type: true,
      status: true,
      createdAt: true,
      submittedAt: true,
      category: { select: { name: true } },
    },
  });
  return json({ applications });
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  await enforceRateLimit(req, 'app-create', { limit: 20, windowSeconds: 3600, key: user.id });
  const { categoryId } = await readJson(req, z.object({ categoryId: z.string().min(1).max(40) }));
  const app = await createDraft(user, categoryId);
  return json({ application: { id: app.id } }, { status: 201 });
});
