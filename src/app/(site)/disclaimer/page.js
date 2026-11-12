import { PageHeader, Alert } from '@/components/ui';

export const metadata = { title: 'Disclaimer' };

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader title="Demonstration disclaimer" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'Disclaimer' }]} />
      <div className="container-page max-w-3xl py-10 prose-embassy">
        <Alert type="warning" title="Higeria is a fictional country">
          This portal demonstrates a digital services platform for an embassy. The Republic of Higeria, its government,
          its embassy and its officials do not exist. This is not a real government website.
        </Alert>
        <ul>
          <li>Do not submit real applications, personal documents or payments.</li>
          <li>Names, contact details, fees, requirements, processing times and policies shown are placeholders.</li>
          <li>Payments use Stripe <strong>test mode</strong>; no real money is transferred.</li>
          <li>The flag and the teal, coral and ivory colours of Higeria are original designs created for this demonstration and do not belong to any real country.</li>
        </ul>
        <p>To adapt this platform for a real embassy, its authorities must approve the project, supply verified official information and assets, and complete security, privacy, legal and operational reviews.</p>
      </div>
    </>
  );
}
