import { categories } from '@/lib/admin-resources';

// Categories are never hard-deleted (applications reference them); set active=false instead.
export const PATCH = categories.update;
