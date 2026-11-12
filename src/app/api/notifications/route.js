import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { route, readJson, json } from '@/lib/http';
import { requireUser } from '@/lib/rbac';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return json({ notifications, unread });
});

/** Mark notifications as read: { ids: [...] } or { all: true } */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = await readJson(
    req,
    z.object({ ids: z.array(z.string().max(40)).max(100).optional(), all: z.boolean().optional() })
  );
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(body.all ? {} : { id: { in: body.ids ?? [] } }) },
    data: { readAt: new Date() },
  });
  return json({ ok: true });
});
