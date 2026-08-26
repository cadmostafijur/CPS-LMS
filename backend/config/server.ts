export default ({ env }) => {
  // Bind address (must stay 0.0.0.0 on Railway so the proxy can reach the process)
  const host = String(env('HOST', '0.0.0.0') || '0.0.0.0').trim() || '0.0.0.0';
  const port = env.int('PORT', 1337);

  // Public URL for admin/API absolute links. NEVER use http://0.0.0.0 — Node DNS
  // fails with getaddrinfo ENOTFOUND when Strapi self-references that host.
  const railwayDomain = String(env('RAILWAY_PUBLIC_DOMAIN', '') || '').trim();
  const publicUrl = String(
    env('PUBLIC_URL') ||
      env('URL') ||
      (railwayDomain ? `https://${railwayDomain}` : '') ||
      `http://127.0.0.1:${port}`
  ).trim();

  return {
    host,
    port,
    url: publicUrl,
    proxy: env.bool('IS_PROXIED', Boolean(railwayDomain) || env('NODE_ENV') === 'production'),
    app: {
      keys: env.array('APP_KEYS'),
    },
  };
};
