import { PageHeader, PlaceholderNotice } from '@/components/ui';

export const metadata = { title: 'Privacy Notice' };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy notice" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'Privacy' }]} />
      <div className="container-page max-w-3xl py-10 prose-embassy">
        <PlaceholderNotice>
          This notice describes how the demonstration software handles data. A legally reviewed privacy policy must be approved by the Embassy before any real use.
        </PlaceholderNotice>
        <h2>What we collect</h2>
        <p>Account details (name, email, optional phone), application information you enter, documents and photographs you upload, payment status records, and inquiries you send. Basic security logs (IP address, browser type) are kept to protect accounts.</p>
        <h2>Payments</h2>
        <p>Card payments are handled entirely by Stripe. This portal never receives or stores card numbers; it stores only the payment amount, status and Stripe reference numbers.</p>
        <h2>How documents are protected</h2>
        <ul>
          <li>Documents are stored in private storage and are never available at a public web address.</li>
          <li>Only you and authorised Embassy staff can view them, through links that expire after five minutes.</li>
          <li>Every staff access to a document is recorded in an audit log.</li>
        </ul>
        <h2>Retention</h2>
        <p>Abandoned drafts and the documents of decided applications are deleted automatically after configurable retention periods. Financial records are kept as required for audit.</p>
        <h2>Your choices</h2>
        <p>You can delete draft applications at any time from your dashboard. For other requests, contact the Embassy.</p>
      </div>
    </>
  );
}
