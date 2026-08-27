import dns from 'node:dns';
import type { Core } from '@strapi/strapi';
import { ensureLmsRoles } from './bootstrap/roles';
import { seedDemoData } from './bootstrap/seed';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* Node < 17 */
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    const ok = { ok: true, service: 'cps-lms-strapi' };
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
      {
        method: 'GET',
        path: '/healthz',
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
      // Do not block HTTP listen on seed (90s+). Railway 502s if the process is not bound yet.
      setImmediate(() => {
        seedDemoData(strapi, roleMap).catch((error) => {
          strapi.log.error('[LMS] Seed failed');
          strapi.log.error(error);
        });
      });
    } catch (error) {
      strapi.log.error('[LMS] Bootstrap failed');
      strapi.log.error(error);
    }
  },
};
