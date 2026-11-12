import Link from 'next/link';
import { requirePageStaff } from '@/lib/auth/current-user';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import FlagMark from '@/components/site/FlagMark';
import SideNav from '@/components/site/SideNav';
import LogoutButton from '@/components/site/LogoutButton';
import DemoBanner from '@/components/site/DemoBanner';

export const dynamic = 'force-dynamic';
export const metadata = { title: { default: 'Administration', template: '%s | Embassy Administration (Demo)' }, robots: { index: false } };

export default async function AdminLayout({ children }) {
  const user = await requirePageStaff(null, '/admin');
  const P = PERMISSIONS;
  const items = [
    { href: '/admin', label: 'Overview', exact: true },
    { href: '/admin/applications', label: 'Applications', perm: P.APPLICATIONS_VIEW },
    { href: '/admin/payments', label: 'Payments', perm: P.PAYMENTS_VIEW },
    { href: '/admin/inquiries', label: 'Inquiries', perm: P.INQUIRIES_MANAGE },
    { href: '/admin/offices', label: 'Offices', perm: P.OFFICES_MANAGE },
    { href: '/admin/news', label: 'News & announcements', perm: P.CONTENT_MANAGE },
    { href: '/admin/faqs', label: 'FAQs', perm: P.CONTENT_MANAGE },
    { href: '/admin/content', label: 'Site content', perm: P.CONTENT_MANAGE },
    { href: '/admin/services', label: 'Services & fees', perm: P.SERVICES_MANAGE },
    { href: '/admin/users', label: 'Staff accounts', perm: P.USERS_MANAGE },
    { href: '/admin/audit', label: 'Audit log', perm: P.AUDIT_VIEW },
  ].filter((i) => !i.perm || hasPermission(user, i.perm));

  return (
    <>
      <DemoBanner />
      <header className="border-b-4 border-accent-500 bg-primary-800 text-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/admin" className="flex items-center gap-3 text-white no-underline">
            <FlagMark className="h-7 w-auto" />
            <span className="font-serif text-lg font-semibold">Embassy Administration</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.firstName} {user.lastName} · <span className="text-primary-200">{user.role.replace('_', ' ').toLowerCase()}</span></span>
            <Link href="/" className="text-white">View site</Link>
            <LogoutButton className="btn btn-sm border border-white/50 text-white hover:bg-white/10" />
          </div>
        </div>
      </header>
      <main id="main" className="flex-1 bg-slate-50">
        <div className="container-page grid gap-8 py-8 lg:grid-cols-[13rem_1fr]">
          <SideNav items={items} label="Administration" />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
