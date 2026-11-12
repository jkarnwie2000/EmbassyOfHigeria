import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/rbac';
import FlagMark from './FlagMark';
import DemoBanner from './DemoBanner';
import NavMenu from './NavMenu';
import LogoutButton from './LogoutButton';

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/offices', label: 'Offices' },
  { href: '/services/passport', label: 'Passports' },
  { href: '/services/visa', label: 'Visas' },
  { href: '/news', label: 'News' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default async function Header() {
  const user = await getCurrentUser();
  const accountHref = user ? (isStaff(user) ? '/admin' : '/dashboard') : null;

  return (
    <header>
      <DemoBanner />
      <div className="h-1 bg-accent-500" aria-hidden="true" />
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center gap-3 no-underline" aria-label="Embassy of the Republic of Higeria, home">
            <FlagMark className="h-9 w-auto shrink-0 border border-slate-200" />
            <span className="leading-tight">
              <span className="block font-serif text-base font-semibold text-primary-800 sm:text-lg">
                Embassy of the Republic of Higeria
              </span>
              <span className="block text-xs text-slate-600 sm:text-sm">Washington, D.C. · Demonstration portal</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/track" className="btn-ghost btn-sm">
              Track application
            </Link>
            {user ? (
              <>
                <Link href={accountHref} className="btn-secondary btn-sm">
                  {isStaff(user) ? 'Admin dashboard' : 'My dashboard'}
                </Link>
                <LogoutButton className="btn-ghost btn-sm" />
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary btn-sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary btn-sm">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <NavMenu items={NAV} user={user ? { firstName: user.firstName, accountHref, staff: isStaff(user) } : null} />
    </header>
  );
}
