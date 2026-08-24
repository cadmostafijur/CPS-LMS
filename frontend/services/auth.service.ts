import { bffFetch } from "@/lib/api";
import type { AuthUser } from "@/types";

export async function login(identifier: string, password: string) {
  return bffFetch<{ user: AuthUser; jwt: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  name?: string;
}) {
  return bffFetch<{ user: AuthUser; jwt: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return bffFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function getMe() {
  return bffFetch<{ user: AuthUser | null }>("/api/auth/me");
}
