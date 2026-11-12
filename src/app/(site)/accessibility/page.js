import { PageHeader } from '@/components/ui';

export const metadata = { title: 'Accessibility' };

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader title="Accessibility statement" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'Accessibility' }]} />
      <div className="container-page max-w-3xl py-10 prose-embassy">
        <p>This portal is designed to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.</p>
        <h2>What we do</h2>
        <ul>
          <li>Semantic page structure with headings, landmarks and a “skip to main content” link.</li>
          <li>Every page can be used with a keyboard alone, with a clearly visible focus indicator.</li>
          <li>Form fields have visible labels, instructions and error messages that are announced by screen readers.</li>
          <li>Text and controls meet AA colour-contrast requirements; touch targets are at least 44 by 44 pixels.</li>
          <li>Layouts adapt to phones, tablets and desktops and support zoom up to 400%.</li>
          <li>Animation is minimal and respects the “reduce motion” setting.</li>
        </ul>
        <h2>Feedback</h2>
        <p>If you find a barrier, please tell us using the <a href="/contact">contact form</a>, choosing “Public Affairs and Information”.</p>
      </div>
    </>
  );
}
