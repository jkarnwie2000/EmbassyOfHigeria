import { PrismaClient } from '@prisma/client';
import { seed } from './seed-data.mjs';

const prisma = new PrismaClient();
try {
  await seed(prisma);
  console.log('Seed complete (placeholder content — replace with verified information).');
} finally {
  await prisma.$disconnect();
}
