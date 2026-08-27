import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  fetchStrapiMe,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/auth";
import type { AuthUser } from "@/types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    return await fetchStrapiMe(token);
  } catch {
    const raw = jar.get(USER_COOKIE)?.value;
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw)) as AuthUser;
    } catch {
      try {
        return JSON.parse(raw) as AuthUser;
      } catch {
        return null;
      }
    }
  }
}

export async function requireUser(nextPath?: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${q}`);
  }
  return user;
}
