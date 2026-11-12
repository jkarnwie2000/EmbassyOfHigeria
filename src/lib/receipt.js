import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatMoney } from './fees';

// Higeria palette: Lagoon teal #0E5C58 and Ember coral #C4422A
const NAVY = rgb(0.055, 0.361, 0.345);
const RED = rgb(0.769, 0.259, 0.165);
const GREY = rgb(0.36, 0.38, 0.44);

/** Generates a PDF receipt for a confirmed payment. */
export async function renderReceiptPdf(payment) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt ${payment.receiptNumber}`);
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  page.drawRectangle({ x: 0, y: 712, width, height: 80, color: NAVY });
  page.drawRectangle({ x: 0, y: 706, width, height: 6, color: RED });
  page.drawText('Embassy of the Republic of Higeria', { x: 48, y: 755, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Washington, D.C. — Payment Receipt', { x: 48, y: 733, size: 12, font, color: rgb(1, 1, 1) });

  let y = 670;
  const row = (label, value) => {
    page.drawText(label, { x: 48, y, size: 11, font: bold, color: GREY });
    page.drawText(String(value), { x: 210, y, size: 11, font });
    y -= 22;
  };
  row('Receipt number', payment.receiptNumber);
  row('Application reference', payment.application.referenceNumber);
  row('Payer', `${payment.user.firstName} ${payment.user.lastName}`);
  row('Date paid', payment.paidAt.toISOString().slice(0, 10));
  row('Payment processor', 'Stripe');
  row('Transaction reference', payment.stripePaymentIntentId || payment.stripeCheckoutSessionId || '—');

  y -= 14;
  page.drawText('Items', { x: 48, y, size: 13, font: bold, color: NAVY });
  y -= 8;
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1, color: GREY });
  y -= 20;
  for (const li of payment.lineItems) {
    page.drawText(li.name.slice(0, 70), { x: 48, y, size: 11, font });
    const amt = formatMoney(li.amountCents, payment.currency);
    page.drawText(amt, { x: width - 48 - font.widthOfTextAtSize(amt, 11), y, size: 11, font });
    y -= 20;
  }
  page.drawLine({ start: { x: 48, y: y + 8 }, end: { x: width - 48, y: y + 8 }, thickness: 1, color: GREY });
  y -= 10;
  const total = formatMoney(payment.amountCents, payment.currency);
  page.drawText('Total paid', { x: 48, y, size: 12, font: bold });
  page.drawText(total, { x: width - 48 - bold.widthOfTextAtSize(total, 12), y, size: 12, font: bold });

  const notice = [
    'DEMONSTRATION SYSTEM — This receipt was produced by a demonstration portal. The Republic',
    'of Higeria is a fictional country; this is not an official receipt. Payments use Stripe',
    'test mode and no real funds are transferred.',
  ];
  notice.forEach((line, i) => page.drawText(line, { x: 48, y: 90 - i * 14, size: 9, font, color: RED }));

  return Buffer.from(await pdf.save());
}
