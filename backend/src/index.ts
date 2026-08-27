import type { Core } from '@strapi/strapi';
import { ensureLmsRoles } from './bootstrap/roles';
import { seedDemoData } from './bootstrap/seed';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    const ok = { ok: true, service: 'cps-lms-strapi' };
    strapi.server.use(async (ctx, next) => {
      if (ctx.path === '/_health' || ctx.path === '/healthz') {
        ctx.status = 200;
        ctx.body = ok;
        return;
      }
      await next();
    });
    strapi.server.routes([
      {
        method: 'GET',
        path: '/_health',
        handler: (ctx) => {
          ctx.status = 200;
          ctx.body = ok;
        },
        config: { auth: false },
      },
    ]);
  },

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
