import Link from 'next/link';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { getSetting } from '@/lib/content';
import FlagMark from './FlagMark';

export default async function Footer() {
  const site = await getSetting('site');
  return (
    <footer className="mt-auto bg-primary-900 text-primary-100">
      <div className="h-1 bg-accent-500" aria-hidden="true" />
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <FlagMark className="h-8 w-auto" />
            <p className="font-serif text-lg font-semibold text-white">Embassy of the Republic of Higeria</p>
          </div>
          <p className="mt-3 text-sm">Washington, D.C., United States of America</p>
          <p className="mt-3 text-xs text-primary-200">
            Demonstration portal. Not an officially authorized government website.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-white">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{site.address}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{site.phone}</li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{site.email}</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-white">Office hours</h2>
          <p className="flex gap-2 whitespace-pre-line text-sm"><Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{site.officeHours}</p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-white">Information</h2>
          <ul className="space-y-2 text-sm">
            {[
              ['/services/passport', 'Passport services'],
              ['/services/visa', 'Visa services'],
              ['/track', 'Track an application'],
              ['/privacy', 'Privacy notice'],
              ['/accessibility', 'Accessibility'],
              ['/disclaimer', 'Disclaimer'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-primary-100 hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-700">
        <p className="container-page py-4 text-xs text-primary-200">
          © {new Date().getFullYear()} Demonstration project. Content marked “placeholder” has not been verified by the Embassy.
        </p>
      </div>
    </footer>
  );
}
