import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { route, readJson, json, ApiError } from '@/lib/http';
import { requireStaff, PERMISSIONS } from '@/lib/rbac';
import { settingSchemas } from '@/lib/validation/admin';
import { audit } from '@/lib/audit';

export const PUT = route(async (req) => {
  const actor = await requireStaff(req, PERMISSIONS.CONTENT_MANAGE);
  const { key, value } = await readJson(req, z.object({ key: z.enum(Object.keys(settingSchemas)), value: z.unknown() }));
  const parsed = settingSchemas[key].safeParse(value);
  if (!parsed.success) {
    const details = {};
    for (const i of parsed.error.issues) details[i.path.join('.')] ??= i.message;
    throw new ApiError(400, 'Please correct the highlighted fields', details);
  }
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: parsed.data },
    update: { value: parsed.data },
  });
  await audit({ actor, action: 'settings.updated', entityType: 'SiteSetting', entityId: key, req });
  try {
    revalidatePath('/', 'layout');
  } catch {
    /* outside Next runtime (tests) */
  }
  return json({ ok: true });
});
