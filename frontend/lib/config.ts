export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export const TOKEN_COOKIE = "cps_token";
export const ROLE_COOKIE = "cps_role";
export const USER_COOKIE = "cps_user";
