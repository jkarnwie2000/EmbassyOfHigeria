import ServicePage from '@/components/site/ServicePage';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Visa Applications',
  description: 'Apply online for a visa to travel to Higeria: tourist, business, transit, diplomatic, official and multiple-entry categories.',
};

export default function VisaServicesPage() {
  return <ServicePage type="VISA" />;
}
