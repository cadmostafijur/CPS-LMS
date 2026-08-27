import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* Node < 17 */
}

export default ({ env }) => {
  // Railway injects PORT — must use it, not a hardcoded 1337.
  const port = Number(process.env.PORT || env('PORT') || 1337);

  const railwayDomain = String(env('RAILWAY_PUBLIC_DOMAIN', '') || '')
    .trim()
    .replace(/^https?:\/\//, '');

  let publicUrl = String(
    env('PUBLIC_URL') || env('URL') || (railwayDomain ? `https://${railwayDomain}` : '') || ''
  )
    .trim()
    .replace(/\/$/, '');

  if (!publicUrl || /0\.0\.0\.0|\[?::\]?/.test(publicUrl)) {
    publicUrl = railwayDomain
      ? `https://${railwayDomain}`
      : `http://127.0.0.1:${port}`;
  }

  return {
    // Always IPv4 bind. Passing HOST=:: on Railway 502s the public domain.
    host: '0.0.0.0',
    port,
    url: publicUrl,
    proxy: true,
    app: {
      keys: env.array('APP_KEYS'),
    },
  };
};
