import ServicePage from '@/components/site/ServicePage';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Passport Applications',
  description: 'Apply online for a first-time, renewal or replacement Higerian passport.',
};

export default function PassportServicesPage() {
  return <ServicePage type="PASSPORT" />;
}
