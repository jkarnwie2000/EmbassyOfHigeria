import { prisma } from './prisma';
import { ApiError, clientIp } from './http';

/**
 * Fixed-window counter stored in PostgreSQL so limits hold across serverless
 * instances. Single atomic upsert (parameterised via Prisma tagged template).
 */
export async function hit(key, limit, windowSeconds) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const rows = await prisma.$queryRaw`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const { count, resetAt: windowEnd } = rows[0];
  return { ok: count <= limit, count, resetAt: windowEnd };
}

export async function enforceRateLimit(req, name, { limit, windowSeconds, key } = {}) {
  const id = key ?? clientIp(req);
  const result = await hit(`${name}:${id}`, limit, windowSeconds);
  if (!result.ok) {
    const retry = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
    throw new ApiError(429, `Too many requests. Please try again in ${retry} seconds.`);
  }
}

export async function purgeExpiredRateLimits() {
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
