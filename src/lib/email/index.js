import { sendEmail } from './mailer';
import { templates } from './templates';

export { testOutbox } from './mailer';
export { STATUS_LABELS } from './templates';

export function sendTemplate(to, name, data) {
  const t = templates[name](data);
  return sendEmail({ to, subject: t.subject, html: t.html, text: t.text });
}
