import { prisma } from './prisma';

/**
 * Computes the payable line items for an application entirely from server-side
 * configuration. Client-supplied amounts are never used.
 */
export async function computeFees(categoryId) {
  const category = await prisma.applicationCategory.findUnique({
    where: { id: categoryId },
    include: { serviceFees: { where: { active: true } } },
  });
  if (!category) throw new Error('Category not found');

  const generic = await prisma.serviceFee.findMany({
    where: { active: true, categoryId: null, appliesTo: category.type },
  });

  const lineItems = [];
  if (category.feeCents > 0) {
    lineItems.push({ name: `${category.name} — application fee`, amountCents: category.feeCents });
  }
  for (const fee of [...category.serviceFees, ...generic]) {
    if (fee.currency !== category.currency) continue; // single-currency checkout
    lineItems.push({ name: fee.name, amountCents: fee.amountCents });
  }
  const totalCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  return { currency: category.currency, lineItems, totalCents, isPlaceholder: category.isPlaceholder };
}

/** Fees shaped for display in client components. */
export async function feesForDisplay(categoryId) {
  const f = await computeFees(categoryId);
  return {
    ...f,
    lineItems: f.lineItems.map((li) => ({ ...li, formatted: formatMoney(li.amountCents, f.currency) })),
    totalFormatted: formatMoney(f.totalCents, f.currency),
  };
}

export function formatMoney(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100
  );
}
