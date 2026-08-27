import type { Core } from '@strapi/strapi';

type AuthCtx = {
  request?: { header?: Record<string, string | string[] | undefined> };
  state: {
    user?: {
      id: number;
      documentId?: string;
      [key: string]: unknown;
    } | null;
  };
};

/**
 * Attach users-permissions user onto ctx.state from Bearer JWT.
 * Used when routes set `auth: false` so Strapi's permission matrix does not
 * return a generic Forbidden before our LMS role checks run.
 */
export async function attachUserFromJwt(ctx: AuthCtx, strapi: Core.Strapi) {
  if (ctx.state?.user?.id) return ctx.state.user;

  const authHeader = String(ctx.request?.header?.authorization || '');
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return null;

  try {
    const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
    if (!payload?.id) return null;
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: payload.id },
      populate: { role: true },
    });
    if (!user || user.blocked) return null;
    ctx.state.user = user;
    return user;
  } catch {
    return null;
  }
}
