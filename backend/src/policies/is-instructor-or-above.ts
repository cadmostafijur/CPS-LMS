import { isAdmin, isContentManager, isInstructor } from '../utils/roles';
import { attachUserFromJwt } from '../utils/jwt-user';

export default async (policyContext: any, _config: unknown, { strapi }: { strapi: any }) => {
  await attachUserFromJwt(policyContext, strapi);
  const userId = policyContext.state?.user?.id;
  if (!userId) return false;

  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { role: true },
  });

  return isAdmin(user) || isContentManager(user) || isInstructor(user);
};
