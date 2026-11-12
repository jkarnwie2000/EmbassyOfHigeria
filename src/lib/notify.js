import { prisma } from './prisma';
import { sendTemplate } from './email';

/** In-app notification + (optionally) a templated email. */
export async function notifyUser(user, { title, body, link, email }) {
  await prisma.notification.create({ data: { userId: user.id, title, body, link } });
  if (email) await sendTemplate(user.email, email.template, { firstName: user.firstName, ...email.data });
}
