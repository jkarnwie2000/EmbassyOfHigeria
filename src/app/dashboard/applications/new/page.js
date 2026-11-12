import { prisma } from '@/lib/prisma';
import { formatMoney, computeFees } from '@/lib/fees';
import StartApplicationButton from '@/components/applications/StartApplicationButton';

export const metadata = { title: 'Start an application' };

export default async function NewApplicationPage() {
  const categories = await prisma.applicationCategory.findMany({ where: { active: true }, orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] });
  const fees = Object.fromEntries(await Promise.all(categories.map(async (c) => [c.id, await computeFees(c.id)])));
  const groups = [['PASSPORT', 'Passport applications'], ['VISA', 'Visa applications']];
  return (
    <div>
      <h1 className="text-3xl font-semibold">Start an application</h1>
      <p className="mt-2 text-slate-700">Choose the application type. Your progress is saved automatically as a draft.</p>
      {groups.map(([type, title]) => (
        <section key={type} className="mt-8" aria-labelledby={`${type}-h`}>
          <h2 id={`${type}-h`} className="text-2xl font-semibold">{title}</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {categories.filter((c) => c.type === type).map((c) => (
              <li key={c.id} className="card flex flex-col">
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-700">{c.description}</p>
                <p className="mt-3 text-sm">Fee: <strong>{formatMoney(fees[c.id].totalCents, fees[c.id].currency)}</strong>{c.isPlaceholder && <span className="text-slate-600"> (test amount)</span>}</p>
                <div className="mt-4"><StartApplicationButton categoryId={c.id} label="Start" /></div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
