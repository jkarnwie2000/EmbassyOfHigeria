import { ApiError, unauthorized, forbidden } from './http';
import { getSessionUser } from './auth/session';

export const PERMISSIONS = {
  APPLICATIONS_VIEW: 'applications.view',
  APPLICATIONS_REVIEW: 'applications.review',
  PAYMENTS_VIEW: 'payments.view',
  OFFICES_MANAGE: 'offices.manage',
  CONTENT_MANAGE: 'content.manage',
  SERVICES_MANAGE: 'services.manage',
  INQUIRIES_MANAGE: 'inquiries.manage',
  USERS_MANAGE: 'users.manage',
  AUDIT_VIEW: 'audit.view',
};

export const PERMISSION_LABELS = {
  'applications.view': 'View applications and documents',
  'applications.review': 'Review applications (status, notes, document requests)',
  'payments.view': 'View payments and reports',
  'offices.manage': 'Manage embassy offices',
  'content.manage': 'Manage homepage, news and FAQs',
  'services.manage': 'Manage application categories, fees and requirements',
  'inquiries.manage': 'Manage contact inquiries',
  'users.manage': 'Manage staff accounts',
  'audit.view': 'View audit logs',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
const STAFF_ROLES = new Set(['STAFF', 'ADMIN', 'SUPER_ADMIN']);

export const isStaff = (user) => !!user && STAFF_ROLES.has(user.role);
export const isAdmin = (user) => !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

export function hasPermission(user, permission) {
  if (!user || !user.active) return false;
  if (isAdmin(user)) return true;
  if (user.role === 'STAFF') return user.permissions.includes(permission);
  return false;
}

/**
 * Restricts which applications a staff member may see. Admins see all.
 * Staff see only application types handled by departments they are assigned to.
 */
export function applicationScope(user) {
  if (isAdmin(user)) return {};
  const types = [...new Set(user.departments.map((d) => d.handlesType).filter(Boolean))];
  return { type: { in: types } };
}

export function canAccessApplicationType(user, type) {
  if (isAdmin(user)) return true;
  return user.departments.some((d) => d.handlesType === type);
}

/** Staff see inquiries addressed to their departments; admins see all. */
export function inquiryScope(user) {
  if (isAdmin(user)) return {};
  return { departmentId: { in: user.departments.map((d) => d.id) } };
}

/** Which roles may the actor create/manage? */
export function manageableRoles(actor) {
  if (actor.role === 'SUPER_ADMIN') return ['STAFF', 'ADMIN', 'SUPER_ADMIN'];
  if (actor.role === 'ADMIN') return ['STAFF'];
  return [];
}

// ── Route-handler guards ──────────────────────────────────────────────────

export async function requireUser(req) {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized();
  return user;
}

export async function requireStaff(req, permission) {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized();
  if (!isStaff(user)) throw forbidden();
  if (permission && !hasPermission(user, permission)) throw forbidden();
  return user;
}

export function assert(condition, status = 403, message) {
  if (!condition) throw new ApiError(status, message || 'Forbidden');
}
