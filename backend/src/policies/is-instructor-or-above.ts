import { isAdmin, isContentManager, isInstructor } from '../utils/roles';

export default async (policyContext: any, _config: unknown, { strapi }: { strapi: any }) => {
  const userId = policyContext.state?.user?.id;
  if (!userId) return false;

  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { role: true },
  });

  return isAdmin(user) || isContentManager(user) || isInstructor(user);
};
