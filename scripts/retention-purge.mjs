// Data-retention job. Run daily (e.g. Vercel Cron, GitHub Actions, or a server cron).
//  - Deletes stored files for applications decided (COMPLETED/REJECTED) more than RETENTION_DAYS_DOCUMENTS ago
//  - Deletes abandoned drafts older than RETENTION_DAYS_DRAFTS
//  - Removes expired sessions and rate-limit counters
// Payment records are kept for financial audit; they contain no card data.
import 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const docDays = Number(process.env.RETENTION_DAYS_DOCUMENTS || 180);
const draftDays = Number(process.env.RETENTION_DAYS_DRAFTS || 90);
const ago = (d) => new Date(Date.now() - d * 864e5);

async function removeFile(key) {
  if (process.env.STORAGE_DRIVER === 'database') {
    await prisma.storedFile.deleteMany({ where: { key } });
  } else if ((process.env.STORAGE_DRIVER || 'local') === 's3') {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
    });
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
  } else {
    const root = path.resolve(process.env.LOCAL_STORAGE_DIR || './storage');
    await fs.rm(path.join(root, key), { force: true });
    await fs.rm(path.join(root, key + '.meta'), { force: true });
  }
}

try {
  const docs = await prisma.document.findMany({
    where: {
      status: { not: 'DELETED' },
      application: { status: { in: ['COMPLETED', 'REJECTED'] }, decidedAt: { lt: ago(docDays) } },
    },
    select: { id: true, storageKey: true },
  });
  for (const d of docs) {
    await removeFile(d.storageKey);
    await prisma.document.update({ where: { id: d.id }, data: { status: 'DELETED' } });
  }

  const drafts = await prisma.application.findMany({
    where: { status: 'DRAFT', updatedAt: { lt: ago(draftDays) } },
    include: { documents: { select: { storageKey: true } } },
  });
  for (const a of drafts) {
    for (const d of a.documents) await removeFile(d.storageKey);
    await prisma.application.delete({ where: { id: a.id } });
  }

  const sessions = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
  await prisma.auditLog.create({
    data: { action: 'retention.purge', metadata: { documents: docs.length, drafts: drafts.length, sessions: sessions.count } },
  });
  console.log(`Purged ${docs.length} documents, ${drafts.length} drafts, ${sessions.count} sessions.`);
} finally {
  await prisma.$disconnect();
}
