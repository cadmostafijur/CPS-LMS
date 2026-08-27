export default ({ env }) => {
  const port = env.int('PORT', 1337);

  // Railway's public proxy talks IPv4. Bind 0.0.0.0 — never "::" (that 502s the domain).
  const host = '0.0.0.0';

  const railwayDomain = String(env('RAILWAY_PUBLIC_DOMAIN', '') || '')
    .trim()
    .replace(/^https?:\/\//, '');

  let publicUrl = String(
    env('PUBLIC_URL') || env('URL') || (railwayDomain ? `https://${railwayDomain}` : '') || ''
  )
    .trim()
    .replace(/\/$/, '');

  // Strapi must not use 0.0.0.0 / :: as its public URL (getaddrinfo ENOTFOUND).
  if (!publicUrl || /0\.0\.0\.0|\[?::\]?/.test(publicUrl)) {
    publicUrl = railwayDomain
      ? `https://${railwayDomain}`
      : `http://127.0.0.1:${port}`;
  }

  return {
    host,
    port,
    url: publicUrl,
    proxy: true,
    app: {
      keys: env.array('APP_KEYS'),
    },
  };
};
