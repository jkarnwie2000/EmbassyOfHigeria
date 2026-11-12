import { prisma } from '@/lib/prisma';
import { route, readJson, json, clientIp, ApiError } from '@/lib/http';
import { contactInquirySchema } from '@/lib/validation/contact';
import { enforceRateLimit } from '@/lib/rate-limit';
import { sendTemplate } from '@/lib/email';

export const POST = route(async (req) => {
  await enforceRateLimit(req, 'contact', { limit: 5, windowSeconds: 3600 });
  const data = await readJson(req, contactInquirySchema);
  if (data.website) return json({ ok: true }, { status: 201 }); // honeypot: silently drop bots

  let department = null;
  if (data.departmentId) {
    department = await prisma.department.findFirst({ where: { id: data.departmentId, active: true } });
    if (!department) throw new ApiError(400, 'Please choose a valid office', { departmentId: 'Invalid office' });
  }

  const inquiry = await prisma.contactInquiry.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      departmentId: department?.id,
      ip: clientIp(req),
    },
  });

  await sendTemplate(data.email, 'inquiryReceivedAck', { name: data.name, subject: data.subject });
  const staffInbox = department?.email && !department.isPlaceholder ? department.email : process.env.INQUIRY_NOTIFY_EMAIL;
  if (staffInbox) await sendTemplate(staffInbox, 'inquiryStaffAlert', { subject: data.subject, department: department?.name });

  return json({ ok: true, id: inquiry.id }, { status: 201 });
});
