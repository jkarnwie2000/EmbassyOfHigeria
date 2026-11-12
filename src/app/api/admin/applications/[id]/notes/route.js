import { prisma } from '@/lib/prisma';
import { route, readJson, json } from '@/lib/http';
import { requireStaff, PERMISSIONS } from '@/lib/rbac';
import { loadApplicationFor } from '@/lib/applications';
import { noteSchema } from '@/lib/validation/admin';
import { audit } from '@/lib/audit';

/** Internal notes — never shown to applicants. */
export const POST = route(async (req, { params }) => {
  const actor = await requireStaff(req, PERMISSIONS.APPLICATIONS_REVIEW);
  const app = await loadApplicationFor(actor, params.id);
  const { body } = await readJson(req, noteSchema);
  const note = await prisma.applicationNote.create({
    data: { applicationId: app.id, authorId: actor.id, body },
  });
  await audit({ actor, action: 'application.note_added', entityType: 'Application', entityId: app.id, req });
  return json({ note }, { status: 201 });
});
