import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

/** Browser link (error page "Sign out") — clear cookies and go to login. */
export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  url.searchParams.set("signedOut", "1");
  const response = NextResponse.redirect(url);
  clearAuthCookies(response);
  return response;
}

/** Client navbar / auth.service logout() */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
