import { requirePageUser } from '@/lib/auth/current-user';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';

export const metadata = { title: 'Account and security' };

export default async function AccountPage() {
  const user = await requirePageUser('/dashboard/account');
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-semibold">Account and security</h1>
      <dl className="card mt-6 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="font-semibold">Name</dt><dd>{user.firstName} {user.lastName}</dd>
        <dt className="font-semibold">Email</dt><dd className="break-all">{user.email}</dd>
      </dl>
      <h2 className="mt-8 text-2xl font-semibold">Change password</h2>
      <p className="mt-1 text-sm text-slate-700">Changing your password signs you out on all other devices.</p>
      <div className="card mt-4"><ChangePasswordForm /></div>
    </div>
  );
}
