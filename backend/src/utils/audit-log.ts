import type { Core } from '@strapi/strapi';

type Ctx = {
  request?: { ip?: string };
  ip?: string;
  params?: Record<string, string>;
};

type AuditUser = { id?: number | string } | null | undefined;

export type AuditInput = {
  user?: AuditUser;
  action: string;
  entity?: string | null;
  entityId?: string | number | null;
  meta?: Record<string, unknown> | null;
  success?: boolean;
  error?: string | null;
  ip?: string | null;
};

function requestIp(ctx?: Ctx) {
  return ctx?.request?.ip || ctx?.ip || null;
}

export async function writeAuditLog(strapi: Core.Strapi, input: AuditInput) {
  const success = input.success !== false;
  const action = success ? input.action : `${input.action}.failed`;

  try {
    await strapi.db.query('api::audit-log.audit-log').create({
      data: {
        action,
        entity: input.entity || null,
        entityId: input.entityId != null ? String(input.entityId) : null,
        meta: {
          ...(input.meta || {}),
          success,
          ...(input.error ? { error: input.error.slice(0, 500) } : {}),
        },
        ip: input.ip || null,
        user: input.user?.id || null,
      },
    });
  } catch (err) {
    strapi.log.warn(
      `audit log write failed (${action}): ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export type AuditedActionConfig = {
  action: string;
  entity?: string;
  entityId?: string | number | null;
  meta?: Record<string, unknown> | null | ((result: unknown, ctx: Ctx) => Record<string, unknown> | null);
  resolveEntityId?: (result: unknown, ctx: Ctx) => string | number | null | undefined;
};

/** Run an admin mutation and record success or failure in audit_logs. */
export async function runAuditedAction<T>(
  strapi: Core.Strapi,
  ctx: Ctx,
  user: AuditUser,
  config: AuditedActionConfig,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await fn();
    const entityId =
      config.resolveEntityId?.(result, ctx) ??
      config.entityId ??
      ctx.params?.id ??
      ctx.params?.userId ??
      null;
    const meta =
      typeof config.meta === 'function' ? config.meta(result, ctx) : config.meta;

    await writeAuditLog(strapi, {
      user,
      action: config.action,
      entity: config.entity,
      entityId,
      meta,
      success: true,
      ip: requestIp(ctx),
    });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await writeAuditLog(strapi, {
      user,
      action: config.action,
      entity: config.entity,
      entityId:
        config.entityId ??
        ctx.params?.id ??
        ctx.params?.userId ??
        null,
      meta: typeof config.meta === 'object' && config.meta ? config.meta : null,
      success: false,
      error: message,
      ip: requestIp(ctx),
    });
    throw err;
  }
}
