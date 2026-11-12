import { PageHeader } from '@/components/ui';
import TrackForm from '@/components/forms/TrackForm';

export const metadata = { title: 'Track an Application', description: 'Check the status of a passport or visa application using your reference number.' };

export default function TrackPage() {
  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Track an application"
        intro="Enter your reference number together with the email address and date of birth given on the application. For full details, sign in to your dashboard."
        breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'Track an application' }]}
      />
      <div className="container-page py-10">
        <TrackForm />
      </div>
    </>
  );
}
