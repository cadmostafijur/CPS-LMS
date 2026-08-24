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

    const res = await fetch(`${getApiBaseUrl()}/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: body.username,
        email: body.email,
        password: body.password,
        name: body.name || body.username,
      }),
    });

    const payload = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error?.message ||
            payload?.message?.[0]?.messages?.[0]?.message ||
            "Registration failed",
        },
        { status: res.status }
      );
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
