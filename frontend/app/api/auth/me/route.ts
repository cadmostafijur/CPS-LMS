import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchStrapiMe, TOKEN_COOKIE, clearAuthCookies } from "@/lib/auth";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = await fetchStrapiMe(token);
    return NextResponse.json({ user });
  } catch {
    const response = NextResponse.json({ user: null }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }
}
