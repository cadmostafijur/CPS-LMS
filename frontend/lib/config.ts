export function getApiBaseUrl() {
  // Prefer 127.0.0.1 over localhost to avoid Windows IPv6 (::1) connection issues
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.STRAPI_API_URL ||
    "http://127.0.0.1:1337/api"
  );
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export const TOKEN_COOKIE = "cps_token";
export const ROLE_COOKIE = "cps_role";
export const USER_COOKIE = "cps_user";
