export default () => async (ctx: { method: string; path: string; status: number; body: unknown }, next: () => Promise<void>) => {
  if (ctx.method === 'GET' && (ctx.path === '/_health' || ctx.path === '/healthz')) {
    ctx.status = 200;
    ctx.body = { ok: true, service: 'cps-lms-strapi' };
    return;
  }
  await next();
};
