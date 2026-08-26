import { NextResponse } from "next/server";
import {
  fetchStrapiMe,
  getApiBaseUrl,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      email?: string;
      password?: string;
      name?: string;
    };

    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    let res: Response;
    try {
      res = await fetch(`${getApiBaseUrl()}/auth/local/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: body.username.trim(),
          email: body.email.trim().toLowerCase(),
          password: body.password,
        }),
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Cannot reach the API. Wait until Strapi finishes starting, then try again.",
        },
        { status: 503 }
      );
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        payload?.error?.message ||
        payload?.message?.[0]?.messages?.[0]?.message ||
        payload?.error?.details?.errors?.[0]?.message ||
        "Registration failed";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const jwt = payload.jwt as string;
    let user = payload.user;
    try {
      user = await fetchStrapiMe(jwt);
    } catch {
      // keep register payload user
    }

    const response = NextResponse.json({ user, jwt });
    setAuthCookies(response, jwt, user);
    return response;
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
