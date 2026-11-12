import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import RegisterForm from '@/components/forms/RegisterForm';

export const metadata = { title: 'Create an account' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold">Create an applicant account</h1>
        <p className="mt-2 text-slate-700">An account lets you save draft applications, upload documents, pay fees and track progress.</p>
        <div className="card mt-6"><RegisterForm /></div>
        <p className="mt-6 text-sm">Already registered? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
