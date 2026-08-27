import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { attachUserFromJwt } from './jwt-user';

const { UnauthorizedError } = errors;

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

export function requireAuth(ctx: AuthCtx) {
  if (!ctx.state.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }
  return ctx.state.user;
}

export async function getAuthUser(ctx: AuthCtx, strapi: Core.Strapi) {
  await attachUserFromJwt(ctx, strapi);
  const authUser = requireAuth(ctx);

  // Prefer fully populated copy (role) when state.user is a thin JWT payload
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: authUser.id },
    populate: { role: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  if (user.blocked) {
    throw new UnauthorizedError('Account is blocked');
  }

  return user;
}
