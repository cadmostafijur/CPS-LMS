import type { Core } from '@strapi/strapi';
import { ensureLmsRoles } from './bootstrap/roles';
import { seedDemoData } from './bootstrap/seed';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      const roleMap = await ensureLmsRoles(strapi);
      await seedDemoData(strapi, roleMap);
    } catch (error) {
      strapi.log.error('[LMS] Bootstrap failed');
      strapi.log.error(error);
    }
  },
};
