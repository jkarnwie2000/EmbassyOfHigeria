import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from './constants';
import { getUserFromToken } from './session';
import { hasPermission, isStaff } from '../rbac';

/** For server components / layouts. */
export async function getCurrentUser() {
  const store = await cookies();
  return getUserFromToken(store.get(SESSION_COOKIE)?.value);
}

export async function requirePageUser(next = '/dashboard') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requirePageStaff(permission, next = '/admin') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!isStaff(user)) redirect('/dashboard');
  if (permission && !hasPermission(user, permission)) redirect('/admin?denied=1');
  return user;
}
