import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { POST as upload } from '@/app/api/applications/[id]/documents/route';
import { GET as docUrl } from '@/app/api/documents/[id]/url/route';
import { GET as localFile } from '@/app/api/files/local/route';
import { GET as media } from '@/app/api/media/[...key]/route';
import { makeReq, call, registerApplicant, createStaffUser, uploadForm, PNG, PDF, EVIL_PDF } from './helpers';
import { createDraft } from './flows';

const up = (cookie, id, form) => call(upload, makeReq('POST', `/api/applications/${id}/documents`, { cookie, form }), { id });

describe('4. Document uploads', () => {
  it('accepts valid files, identifies type by content, and stores them privately under random keys', async () => {
    const a = await registerApplicant();
    const { id } = await createDraft(a.cookie, 'PASSPORT_NEW');
    // Declared name/type lie: content is PNG
    const r = await up(a.cookie, id, uploadForm(PNG, 'PASSPORT_PHOTO', '../../etc/passwd.exe', 'application/x-msdownload'));
    expect(r.status).toBe(201);
    expect(r.body.document.mimeType).toBe('image/png');
    expect(r.body.document).not.toHaveProperty('storageKey');
    const doc = await prisma.document.findUnique({ where: { id: r.body.document.id } });
    expect(doc.storageKey).toMatch(new RegExp(`^applications/${id}/[0-9a-f-]{36}\\.png$`));
    expect(doc.originalName).not.toContain('/');
    expect(doc.sha256).toHaveLength(64);
  });

  it('rejects unsupported, disallowed, malicious and oversized files', async () => {
    const a = await registerApplicant();
    const { id } = await createDraft(a.cookie, 'PASSPORT_NEW');
    const exe = await up(a.cookie, id, uploadForm(Buffer.from('MZ\x90\x00 fake executable'), 'ID_DOCUMENT', 'x.pdf'));
    expect(exe.status).toBe(415);
    const pdfAsPhoto = await up(a.cookie, id, uploadForm(PDF, 'PASSPORT_PHOTO', 'photo.pdf'));
    expect(pdfAsPhoto.status).toBe(415);
    const evil = await up(a.cookie, id, uploadForm(EVIL_PDF, 'ID_DOCUMENT', 'evil.pdf'));
    expect(evil.status).toBe(400);
    const polyglot = await up(a.cookie, id, uploadForm(Buffer.concat([PNG, Buffer.from('<script>alert(1)</script>')]), 'PASSPORT_PHOTO', 'p.png'));
    expect(polyglot.status).toBe(400);
    const big = await up(a.cookie, id, uploadForm(Buffer.concat([PDF, Buffer.alloc(6 * 1024 * 1024)]), 'ID_DOCUMENT', 'big.pdf'));
    expect(big.status).toBe(413);
    const unknownType = await up(a.cookie, id, uploadForm(PDF, 'NOT_A_REAL_TYPE', 'a.pdf'));
    expect(unknownType.status).toBe(400);
    expect(await prisma.document.count({ where: { applicationId: id } })).toBe(0);
  });

  it('replaces a document of the same type in a draft', async () => {
    const a = await registerApplicant();
    const { id } = await createDraft(a.cookie, 'PASSPORT_NEW');
    await up(a.cookie, id, uploadForm(PDF, 'BIRTH_CERTIFICATE', 'one.pdf'));
    await up(a.cookie, id, uploadForm(PNG, 'BIRTH_CERTIFICATE', 'two.png'));
    const active = await prisma.document.findMany({ where: { applicationId: id, docType: 'BIRTH_CERTIFICATE', status: 'ACTIVE' } });
    expect(active).toHaveLength(1);
    expect(active[0].originalName).toBe('two.png');
  });

  it('serves documents only via short-lived signed links to authorised users', async () => {
    const a = await registerApplicant();
    const { id } = await createDraft(a.cookie, 'VISA_TOURIST');
    const r = await up(a.cookie, id, uploadForm(PDF, 'BIO_DATA_PAGE', 'bio.pdf'));
    const docId = r.body.document.id;

    const owner = await call(docUrl, makeReq('GET', `/api/documents/${docId}/url`, { cookie: a.cookie }), { id: docId });
    expect(owner.status).toBe(200);
    expect(owner.body.expiresIn).toBe(300);

    // Signed link works…
    const file = await call(localFile, makeReq('GET', owner.body.url));
    expect(file.status).toBe(200);
    expect(file.res.headers.get('content-type')).toBe('application/pdf');
    expect(file.res.headers.get('content-disposition')).toMatch(/^attachment/);
    // …but tampering with it fails
    const tampered = await call(localFile, makeReq('GET', owner.body.url.replace(/sig=[^&]+/, 'sig=forged')));
    expect(tampered.status).toBe(403);
    const otherKey = await call(localFile, makeReq('GET', owner.body.url.replace(/key=[^&]+/, 'key=applications%2Fx.pdf')));
    expect(otherKey.status).toBe(403);
    // Private documents are never reachable through the public media route
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    const viaMedia = await call(media, makeReq('GET', `/api/media/${doc.storageKey}`), { key: ['..', ...doc.storageKey.split('/')] });
    expect(viaMedia.status).toBe(404);

    const stranger = await registerApplicant();
    expect((await call(docUrl, makeReq('GET', `/api/documents/${docId}/url`, { cookie: stranger.cookie }), { id: docId })).status).toBe(404);

    const passportStaff = await createStaffUser({ permissions: ['applications.view'], departments: ['passport-and-immigration'] });
    expect((await call(docUrl, makeReq('GET', `/api/documents/${docId}/url`, { cookie: passportStaff.cookie }), { id: docId })).status).toBe(404);

    const visaStaff = await createStaffUser({ permissions: ['applications.view'], departments: ['visa-and-entry-permits'] });
    const ok = await call(docUrl, makeReq('GET', `/api/documents/${docId}/url`, { cookie: visaStaff.cookie }), { id: docId });
    expect(ok.status).toBe(200);
    const log = await prisma.auditLog.findFirst({ where: { action: 'document.accessed_by_staff', entityId: docId } });
    expect(log.actorId).toBe(visaStaff.user.id);
  });
});
