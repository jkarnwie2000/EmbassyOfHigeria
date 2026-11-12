import { prisma } from '../prisma';
import { PERMISSIONS } from '../rbac';
import { crudHandlers } from '../admin-crud';
import {
  departmentSchema,
  announcementSchema,
  faqSchema,
  categorySchema,
  requirementSchema,
  serviceFeeSchema,
} from '../validation/admin';

const nullIfEmpty = (v) => (v === '' ? null : v);

export const departments = crudHandlers({
  model: () => prisma.department,
  permission: PERMISSIONS.OFFICES_MANAGE,
  schema: departmentSchema,
  entity: 'Department',
});

export const announcements = crudHandlers({
  model: () => prisma.announcement,
  permission: PERMISSIONS.CONTENT_MANAGE,
  schema: announcementSchema,
  entity: 'Announcement',
  toData: (d, actor, isUpdate) => {
    const data = { ...d };
    if ('departmentId' in data) data.departmentId = nullIfEmpty(data.departmentId);
    if ('publishedAt' in data) data.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    if (data.published && !data.publishedAt && !isUpdate) data.publishedAt = new Date();
    if (data.published && isUpdate && data.publishedAt === null) data.publishedAt = new Date();
    if (!isUpdate) data.authorId = actor.id;
    return data;
  },
});

export const faqs = crudHandlers({
  model: () => prisma.faq,
  permission: PERMISSIONS.CONTENT_MANAGE,
  schema: faqSchema,
  entity: 'Faq',
  toData: (d) => ('departmentId' in d ? { ...d, departmentId: nullIfEmpty(d.departmentId) } : d),
});

export const categories = crudHandlers({
  model: () => prisma.applicationCategory,
  permission: PERMISSIONS.SERVICES_MANAGE,
  schema: categorySchema,
  entity: 'ApplicationCategory',
});

export const requirements = crudHandlers({
  model: () => prisma.documentRequirement,
  permission: PERMISSIONS.SERVICES_MANAGE,
  schema: requirementSchema,
  entity: 'DocumentRequirement',
});

export const serviceFees = crudHandlers({
  model: () => prisma.serviceFee,
  permission: PERMISSIONS.SERVICES_MANAGE,
  schema: serviceFeeSchema,
  entity: 'ServiceFee',
  toData: (d) => ('categoryId' in d ? { ...d, categoryId: nullIfEmpty(d.categoryId) } : d),
});
