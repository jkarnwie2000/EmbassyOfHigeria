import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../env';

/**
 * Storage abstraction. All application documents are PRIVATE. Callers only ever
 * receive short-lived signed links, never permanent URLs.
 *
 *   put(key, buffer, contentType)
 *   get(key) -> { body: Buffer, contentType }
 *   signedUrl(key, { expiresIn, filename, contentType, inline })
 *   remove(key)
 */

const KEY_PATTERN = /^[a-z0-9][a-z0-9/_.-]{0,250}$/i;

export function assertSafeKey(key) {
  if (!KEY_PATTERN.test(key) || key.includes('..') || key.includes('//')) {
    throw new Error('Invalid storage key');
  }
}

// ── Local driver (development only) ─────────────────────────────────────────

function localRoot() {
  return path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || './storage');
}

function localPath(key) {
  assertSafeKey(key);
  const root = localRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('Invalid storage key');
  return full;
}

export function signLocal(key, exp, disposition) {
  return crypto
    .createHmac('sha256', env.appSecret)
    .update(`${key}\n${exp}\n${disposition}`)
    .digest('base64url');
}

export function verifyLocalSignature(key, exp, disposition, sig) {
  if (!key || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signLocal(key, exp, disposition));
  const given = Buffer.from(String(sig));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

const localDriver = {
  async put(key, body, contentType) {
    const file = localPath(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, { mode: 0o600 });
    await fs.writeFile(file + '.meta', JSON.stringify({ contentType }), { mode: 0o600 });
  },
  async get(key) {
    const file = localPath(key);
    const body = await fs.readFile(file);
    let contentType = 'application/octet-stream';
    try {
      contentType = JSON.parse(await fs.readFile(file + '.meta', 'utf8')).contentType;
    } catch {
      /* default */
    }
    return { body, contentType };
  },
  async signedUrl(key, { expiresIn = 300, inline = false } = {}) {
    assertSafeKey(key);
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    const disposition = inline ? 'inline' : 'attachment';
    const sig = signLocal(key, exp, disposition);
    const qs = new URLSearchParams({ key, exp: String(exp), d: disposition, sig });
    return `/api/files/local?${qs}`;
  },
  async remove(key) {
    const file = localPath(key);
    await fs.rm(file, { force: true });
    await fs.rm(file + '.meta', { force: true });
  },
};

// ── Database driver (serverless hosts without S3, e.g. a Vercel demo) ───────
// Files are stored as bytea in PostgreSQL and served only through the same
// HMAC-signed, expiring links as the local driver.

const databaseDriver = {
  async put(key, body, contentType) {
    assertSafeKey(key);
    const { prisma } = await import('../prisma');
    await prisma.storedFile.upsert({
      where: { key },
      create: { key, data: body, contentType, size: body.length },
      update: { data: body, contentType, size: body.length },
    });
  },
  async get(key) {
    assertSafeKey(key);
    const { prisma } = await import('../prisma');
    const row = await prisma.storedFile.findUnique({ where: { key } });
    if (!row) throw new Error('File not found');
    return { body: Buffer.from(row.data), contentType: row.contentType };
  },
  signedUrl: (...args) => localDriver.signedUrl(...args),
  async remove(key) {
    assertSafeKey(key);
    const { prisma } = await import('../prisma');
    await prisma.storedFile.deleteMany({ where: { key } });
  },
};

// ── S3-compatible driver (production) ───────────────────────────────────────

let s3Client;
async function s3() {
  if (!s3Client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

const bucket = () => {
  if (!process.env.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  return process.env.S3_BUCKET;
};

const s3Driver = {
  async put(key, body, contentType) {
    assertSafeKey(key);
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(
      new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType })
    );
  },
  async get(key) {
    assertSafeKey(key);
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const res = await (await s3()).send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    const body = Buffer.from(await res.Body.transformToByteArray());
    return { body, contentType: res.ContentType || 'application/octet-stream' };
  },
  async signedUrl(key, { expiresIn = 300, filename, contentType, inline = false } = {}) {
    assertSafeKey(key);
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const safeName = (filename || 'document').replace(/[^\w.\- ]/g, '_');
    return getSignedUrl(
      await s3(),
      new GetObjectCommand({
        Bucket: bucket(),
        Key: key,
        ResponseContentDisposition: `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
        ResponseContentType: contentType,
      }),
      { expiresIn }
    );
  },
  async remove(key) {
    assertSafeKey(key);
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  },
};

export function getStorage() {
  const driver = env.storageDriver;
  if (driver === 's3') return s3Driver;
  if (driver === 'database') return databaseDriver;
  if (driver === 'local') {
    if (env.isProduction && process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION !== 'true') {
      throw new Error('Local storage is for development only. Configure STORAGE_DRIVER=s3.');
    }
    return localDriver;
  }
  throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
}
