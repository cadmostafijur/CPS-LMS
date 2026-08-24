import { NextResponse } from "next/server";
import {
  fetchStrapiMe,
  getApiBaseUrl,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
    };

    if (!body.identifier || !body.password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${getApiBaseUrl()}/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: body.identifier,
        password: body.password,
      }),
    });

    const payload = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error?.message ||
            payload?.message?.[0]?.messages?.[0]?.message ||
            "Invalid credentials",
        },
        { status: res.status }
      );
    }

    const jwt = payload.jwt as string;
    let user = payload.user;
    try {
      user = await fetchStrapiMe(jwt);
    } catch {
      // fall back to auth response user
    }

    const response = NextResponse.json({ user, jwt });
    setAuthCookies(response, jwt, user);
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
