'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNav({ items, label }) {
  const pathname = usePathname();
  const active = (i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + '/'));
  return (
    <nav aria-label={label}>
      <p className="mb-2 hidden text-xs font-bold uppercase tracking-wider text-slate-600 lg:block">{label}</p>
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {items.map((i) => (
          <li key={i.href} className="shrink-0">
            <Link
              href={i.href}
              aria-current={active(i) ? 'page' : undefined}
              className={`block whitespace-nowrap rounded px-3 py-2 text-sm font-semibold no-underline ${active(i) ? 'bg-primary-700 text-white' : 'text-primary-800 hover:bg-primary-100'}`}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
