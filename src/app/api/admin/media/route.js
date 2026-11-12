import { route, json } from '@/lib/http';
import { requireStaff, PERMISSIONS } from '@/lib/rbac';
import { inspectFile, newStorageKey, readUploadedFile } from '@/lib/uploads';
import { getStorage } from '@/lib/storage';
import { audit } from '@/lib/audit';

/** Uploads a PUBLIC image (news / homepage). Served via /api/media/... */
export const POST = route(async (req) => {
  const actor = await requireStaff(req, PERMISSIONS.CONTENT_MANAGE);
  const { buffer } = await readUploadedFile(req);
  const info = inspectFile(buffer, { acceptedMime: ['image/jpeg', 'image/png'], maxBytes: 5 * 1024 * 1024 });
  const key = newStorageKey('public/media', info.ext);
  await getStorage().put(key, buffer, info.mime);
  await audit({ actor, action: 'media.uploaded', entityType: 'Media', entityId: key, req });
  return json({ key, url: `/api/media/${key.slice('public/'.length)}` }, { status: 201 });
});
