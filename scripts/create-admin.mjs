// Creates (or resets) the initial SUPER_ADMIN account.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || process.argv[3] || '';

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (or pass them as arguments).');
  process.exit(1);
}
if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  console.error('Password must be 12+ characters with upper-case, lower-case and a number.');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, firstName: 'System', lastName: 'Administrator', role: 'SUPER_ADMIN' },
    update: { passwordHash, role: 'SUPER_ADMIN', active: true, failedLoginCount: 0, lockedUntil: null },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'user.super_admin_bootstrap', entityType: 'User', entityId: user.id } });
  console.log(`Super-admin ready: ${email}`);
} finally {
  await prisma.$disconnect();
}
