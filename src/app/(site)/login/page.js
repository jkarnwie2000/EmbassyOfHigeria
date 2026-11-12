import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/rbac';
import LoginForm from '@/components/forms/LoginForm';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(isStaff(user) ? '/admin' : '/dashboard');
  // Only allow same-site relative redirects (prevents open redirects)
  const next = typeof sp.next === 'string' && /^\/(?!\/)[\w\-/?=&.%]*$/.test(sp.next) ? sp.next : null;
  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-slate-700">Applicants and Embassy staff sign in here.</p>
        <div className="card mt-6"><LoginForm next={next} /></div>
        <p className="mt-6 text-sm">No account yet? <Link href="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
