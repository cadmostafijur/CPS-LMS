export default ({ env }) => {
  const port = env.int('PORT', 1337);
  const isRailway = Boolean(env('RAILWAY_ENVIRONMENT') || env('RAILWAY_PUBLIC_DOMAIN'));

  // Railway prefers dual-stack bind; 0.0.0.0 is fine locally.
  const rawHost = String(env('HOST', isRailway ? '::' : '0.0.0.0') || '').trim();
  const host = rawHost || (isRailway ? '::' : '0.0.0.0');

  const railwayDomain = String(env('RAILWAY_PUBLIC_DOMAIN', '') || '')
    .trim()
    .replace(/^https?:\/\//, '');

  let publicUrl = String(
    env('PUBLIC_URL') || env('URL') || (railwayDomain ? `https://${railwayDomain}` : '') || ''
  )
    .trim()
    .replace(/\/$/, '');

  // Never self-reference 0.0.0.0 / :: — causes getaddrinfo ENOTFOUND after bootstrap.
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
