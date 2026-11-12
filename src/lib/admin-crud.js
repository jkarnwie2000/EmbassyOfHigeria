import { Prisma } from '@prisma/client';
import { ApiError, json, notFound, readJson, route } from './http';
import { requireStaff } from './rbac';
import { audit } from './audit';

/** Converts unique-constraint violations into friendly 409 errors. */
export function friendlyDbError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = [].concat(err.meta?.target ?? []).join(', ');
      return new ApiError(409, `A record with this ${field || 'value'} already exists`, field ? { [field]: 'Already in use' } : undefined);
    }
    if (err.code === 'P2025') return notFound('Record not found');
    if (err.code === 'P2003') return new ApiError(400, 'A related record does not exist');
  }
  return err;
}

/**
 * Generates POST (collection) and PATCH/DELETE (item) handlers for simple
 * admin-managed resources, with permission checks, validation and audit logging.
 */
export function crudHandlers({ model, permission, schema, entity, toData = (d) => d }) {
  const create = route(async (req) => {
    const actor = await requireStaff(req, permission);
    const data = await readJson(req, schema);
    try {
      const record = await model().create({ data: await toData(data, actor) });
      await audit({ actor, action: `${entity}.created`, entityType: entity, entityId: record.id, req });
      return json({ record }, { status: 201 });
    } catch (err) {
      throw friendlyDbError(err);
    }
  });

  const update = route(async (req, { params }) => {
    const actor = await requireStaff(req, permission);
    const data = await readJson(req, schema.partial ? schema.partial() : schema);
    try {
      const record = await model().update({ where: { id: params.id }, data: await toData(data, actor, true) });
      await audit({ actor, action: `${entity}.updated`, entityType: entity, entityId: record.id, metadata: { fields: Object.keys(data) }, req });
      return json({ record });
    } catch (err) {
      throw friendlyDbError(err);
    }
  });

  const remove = route(async (req, { params }) => {
    const actor = await requireStaff(req, permission);
    try {
      await model().delete({ where: { id: params.id } });
    } catch (err) {
      throw friendlyDbError(err);
    }
    await audit({ actor, action: `${entity}.deleted`, entityType: entity, entityId: params.id, req });
    return json({ ok: true });
  });

  return { create, update, remove };
}
