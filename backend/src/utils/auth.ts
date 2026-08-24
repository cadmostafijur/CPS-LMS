import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { UnauthorizedError } = errors;

type AuthCtx = {
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
  const authUser = requireAuth(ctx);

  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: authUser.id },
    populate: { role: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
}
