import Link from 'next/link';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { departmentFields } from '@/lib/forms/admin-fields';
import ResourceForm from '@/components/admin/ResourceForm';

export const metadata = { title: 'Add office' };

export default async function NewOffice() {
  await requirePageStaff(PERMISSIONS.OFFICES_MANAGE, '/admin/offices/new');
  return (
    <div>
      <p><Link href="/admin/offices">← Offices</Link></p>
      <h1 className="mt-2 text-3xl font-semibold">Add office</h1>
      <div className="card mt-6">
        <ResourceForm endpoint="/api/admin/departments" fields={departmentFields} defaults={{ active: true, isPlaceholder: true, sortOrder: 0 }} submitLabel="Create office" redirectTo="/admin/offices/{id}" />
      </div>
    </div>
  );
}
