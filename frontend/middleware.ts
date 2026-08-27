import { NextResponse, type NextRequest } from "next/server";
import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/config";
import { normalizeRoleName, rolesAllowedForPath } from "@/lib/roles";

const PROTECTED_PREFIXES = [
  "/admin",
  "/content-manager",
  "/instructor",
  "/student",
  "/dashboard",
  "/learn",
  "/quizzes",
  "/certificates",
  "/profile",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = normalizeRoleName(request.cookies.get(ROLE_COOKIE)?.value);
  const allowed = rolesAllowedForPath(pathname);

  if (allowed && role && !allowed.includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (allowed && !role) {
    if (pathname === "/dashboard" || pathname.startsWith("/profile")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/content-manager/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/dashboard",
    "/learn/:path*",
    "/quizzes/:path*",
    "/certificates/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
