import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import SideNav from '@/components/site/SideNav';
import { requirePageUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My dashboard', robots: { index: false } };

export default async function DashboardLayout({ children }) {
  const user = await requirePageUser('/dashboard');
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  const items = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/applications/new', label: 'Start an application' },
    { href: '/dashboard/payments', label: 'Payments & receipts' },
    { href: '/dashboard/notifications', label: `Notifications${unread ? ` (${unread})` : ''}` },
    { href: '/dashboard/account', label: 'Account & security' },
  ];
  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-slate-50">
        <div className="container-page grid gap-8 py-8 lg:grid-cols-[14rem_1fr]">
          <SideNav items={items} label="Applicant dashboard" />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
