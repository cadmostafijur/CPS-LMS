import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { AuthUser } from "@/types";
import { getRoleName } from "@/lib/roles";
import {
  getApiBaseUrl,
  ROLE_COOKIE,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config";

export {
  getApiBaseUrl,
  getSiteUrl,
  ROLE_COOKIE,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value ?? null;
}

export async function getRoleFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ROLE_COOKIE)?.value ?? null;
}

export function setAuthCookies(
  response: NextResponse,
  token: string,
  user: AuthUser
) {
  const role = getRoleName(user) || "Student";
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  response.cookies.set(ROLE_COOKIE, role, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  response.cookies.set(
    USER_COOKIE,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }),
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    }
  );
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of [TOKEN_COOKIE, ROLE_COOKIE, USER_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export async function fetchStrapiMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${getApiBaseUrl()}/lms/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  const payload = (await res.json()) as { data?: AuthUser } & AuthUser;
  return (payload.data || payload) as AuthUser;
}
