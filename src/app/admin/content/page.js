import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { getSetting } from '@/lib/content';
import { settingsFields } from '@/lib/forms/admin-fields';
import SettingsForm from '@/components/admin/SettingsForm';

export const metadata = { title: 'Site content' };

const SECTIONS = [
  ['home', 'Homepage', 'Hero banner, welcome message and the Ambassador’s message.'],
  ['site', 'Contact details and office hours', 'Shown in the footer, on the contact page and on the homepage.'],
  ['about', 'About the Embassy', 'History, mission, leadership and Higeria–U.S. relations.'],
];

export default async function AdminContent() {
  await requirePageStaff(PERMISSIONS.CONTENT_MANAGE, '/admin/content');
  const values = Object.fromEntries(await Promise.all(SECTIONS.map(async ([k]) => [k, await getSetting(k)])));
  return (
    <div>
      <h1 className="text-3xl font-semibold">Site content</h1>
      <p className="mt-1 text-slate-700">Untick “placeholder” only after the information has been verified and approved by the Embassy.</p>
      <div className="mt-6 space-y-4">
        {SECTIONS.map(([key, title, intro]) => (
          <details key={key} className="card" open={key === 'home'}>
            <summary className="cursor-pointer text-xl font-semibold text-primary-800">{title}</summary>
            <p className="mt-1 text-sm text-slate-600">{intro}</p>
            <div className="mt-4"><SettingsForm settingKey={key} fields={settingsFields[key]} defaults={values[key]} /></div>
          </details>
        ))}
      </div>
    </div>
  );
}
