'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function NavMenu({ items, user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav aria-label="Main" className="bg-primary-700 text-white">
      <div className="container-page">
        <div className="flex items-center justify-between md:hidden">
          <span className="py-3 text-sm font-semibold">Menu</span>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center"
            aria-expanded={open}
            aria-controls="main-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
        <ul id="main-menu" className={`${open ? 'block' : 'hidden'} pb-3 md:flex md:flex-wrap md:pb-0`}>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`block px-3 py-3 text-sm font-semibold text-white no-underline hover:bg-primary-800 md:py-3.5 ${
                  isActive(item.href) ? 'bg-primary-900 md:border-b-[3px] md:border-accent-500 md:pb-2.5' : ''
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 border-t border-primary-500 pt-2 md:hidden">
            <Link href="/track" className="block px-3 py-3 text-sm font-semibold text-white no-underline">
              Track application
            </Link>
            {user ? (
              <>
                <Link href={user.accountHref} className="block px-3 py-3 text-sm font-semibold text-white no-underline">
                  {user.staff ? 'Admin dashboard' : 'My dashboard'}
                </Link>
                <LogoutButton className="block w-full px-3 py-3 text-left text-sm font-semibold text-white" />
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-3 text-sm font-semibold text-white no-underline">
                  Sign in
                </Link>
                <Link href="/register" className="block px-3 py-3 text-sm font-semibold text-white no-underline">
                  Create account
                </Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
