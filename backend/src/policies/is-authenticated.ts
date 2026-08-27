import { attachUserFromJwt } from '../utils/jwt-user';

export default async (policyContext: any, _config: unknown, { strapi }: { strapi: any }) => {
  const user = await attachUserFromJwt(policyContext, strapi);
  return Boolean(user?.id);
};
