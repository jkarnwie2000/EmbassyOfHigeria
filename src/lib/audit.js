import { prisma } from './prisma';
import { clientIp } from './http';

/**
 * Records a security-relevant action. Never put passwords, tokens, or document
 * contents in metadata.
 */
export async function audit({ actor, action, entityType, entityId, metadata, req }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata: metadata ?? undefined,
        ip: req ? clientIp(req) : null,
        userAgent: req?.headers.get('user-agent')?.slice(0, 300) ?? null,
      },
    });
  } catch (err) {
    // Audit failures must never break the user's request, but must be visible to operators.
    console.error('[audit] failed to record', action, err);
  }
}
