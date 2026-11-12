import { env } from '../env';
import { formatMoney } from '../fees';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PAYMENT_PENDING: 'Payment pending',
  PAYMENT_CONFIRMED: 'Payment confirmed',
  UNDER_REVIEW: 'Under review',
  ADDITIONAL_DOCUMENTS_REQUIRED: 'Additional documents required',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
  COMPLETED: 'Completed',
};

/**
 * Branded layout. Emails deliberately contain no personal data beyond the
 * recipient's first name and the application reference number.
 */
function layout({ title, paragraphs, cta }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.55">${esc(p)}</p>`).join('');
  const button = cta
    ? `<p style="margin:22px 0"><a href="${esc(cta.href)}" style="background:#0e5c58;color:#fff;padding:11px 20px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
    : '';
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f8;font-family:Arial,Helvetica,sans-serif;color:#1b1f2a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #dde1ea">
<tr><td style="background:#0e5c58;padding:18px 24px;color:#fff;font-size:17px;font-weight:bold">Embassy of the Republic of Higeria · Washington, D.C.</td></tr>
<tr><td style="height:4px;background:#c4422a"></td></tr>
<tr><td style="padding:26px 24px">
<h1 style="font-size:20px;margin:0 0 16px;color:#0e5c58">${esc(title)}</h1>${body}${button}
<p style="margin:22px 0 0;font-size:12px;color:#5b6170;line-height:1.5">This is an automated message from a <strong>demonstration</strong> embassy services portal. The Republic of Higeria is a fictional country; this is not an official government communication. Do not reply to this email.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [title, '', ...paragraphs, cta ? `\n${cta.label}: ${cta.href}` : '', '\n— Demonstration portal. Not an official government communication.'].join('\n');
  return { html, text };
}

const link = (path) => `${env.appUrl}${path}`;

export const templates = {
  welcome: ({ firstName }) => ({
    subject: 'Your embassy portal account has been created',
    ...layout({
      title: 'Welcome to the embassy services portal',
      paragraphs: [
        `Dear ${firstName},`,
        'Your account has been created. You can now start passport and visa applications, upload documents, and track your applications online.',
        'If you did not create this account, please contact the embassy.',
      ],
      cta: { label: 'Go to your dashboard', href: link('/dashboard') },
    }),
  }),

  applicationSubmitted: ({ firstName, reference, typeLabel, amountDue, currency }) => ({
    subject: `Application received — reference ${reference}`,
    ...layout({
      title: `${typeLabel} application received`,
      paragraphs: [
        `Dear ${firstName},`,
        `Your application has been submitted. Your reference number is ${reference}. Please keep it for your records; you will need it to track your application.`,
        amountDue > 0
          ? `A payment of ${formatMoney(amountDue, currency)} is required before your application can be reviewed.`
          : 'No payment is required for this application.',
      ],
      cta: { label: 'View your application', href: link('/dashboard') },
    }),
  }),

  paymentSucceeded: ({ firstName, reference, receipt, amount, currency }) => ({
    subject: `Payment confirmed — ${reference}`,
    ...layout({
      title: 'Payment confirmed',
      paragraphs: [
        `Dear ${firstName},`,
        `We have received your payment of ${formatMoney(amount, currency)} for application ${reference}.`,
        `Receipt number: ${receipt}. You can download your receipt from your dashboard.`,
      ],
      cta: { label: 'View payment history', href: link('/dashboard/payments') },
    }),
  }),

  paymentFailed: ({ firstName, reference }) => ({
    subject: `Payment not completed — ${reference}`,
    ...layout({
      title: 'Your payment was not completed',
      paragraphs: [
        `Dear ${firstName},`,
        `The payment for application ${reference} could not be completed. No charge has been confirmed. You can try again from your dashboard.`,
      ],
      cta: { label: 'Return to your dashboard', href: link('/dashboard') },
    }),
  }),

  documentsRequested: ({ firstName, reference, message }) => ({
    subject: `Additional documents required — ${reference}`,
    ...layout({
      title: 'Additional documents are required',
      paragraphs: [
        `Dear ${firstName},`,
        `The embassy has requested additional documents for application ${reference}.`,
        `Message from the embassy: ${message}`,
        'Please sign in to upload the requested documents.',
      ],
      cta: { label: 'Upload documents', href: link('/dashboard') },
    }),
  }),

  statusChanged: ({ firstName, reference, status, note }) => {
    const label = STATUS_LABELS[status] || status;
    const title =
      status === 'APPROVED'
        ? 'Your application has been approved'
        : status === 'REJECTED'
          ? 'Decision on your application'
          : `Application status: ${label}`;
    return {
      subject: `${title} — ${reference}`,
      ...layout({
        title,
        paragraphs: [
          `Dear ${firstName},`,
          `The status of application ${reference} is now: ${label}.`,
          ...(note ? [`Message from the embassy: ${note}`] : []),
          'Sign in to view details.',
        ],
        cta: { label: 'View application', href: link('/dashboard') },
      }),
    };
  },

  inquiryReceivedAck: ({ name, subject }) => ({
    subject: 'We have received your inquiry',
    ...layout({
      title: 'Thank you for contacting the embassy',
      paragraphs: [`Dear ${name},`, `We have received your inquiry "${subject}". A member of staff will respond as soon as possible.`],
    }),
  }),

  inquiryStaffAlert: ({ subject, department }) => ({
    subject: `New inquiry: ${subject}`,
    ...layout({
      title: 'New contact inquiry',
      paragraphs: [`A new inquiry has been received${department ? ` for ${department}` : ''}.`, 'Sign in to the administration dashboard to view it.'],
      cta: { label: 'Open inquiries', href: link('/admin/inquiries') },
    }),
  }),
};
