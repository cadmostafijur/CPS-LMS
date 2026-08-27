import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getApiBaseUrl, TOKEN_COOKIE } from "@/lib/config";

async function proxy(request: NextRequest, pathParts: string[]) {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  const targetPath = pathParts.join("/");
  const isPublic =
    targetPath.startsWith("certificates/verify/") ||
    targetPath === "announcements" ||
    targetPath === "banners" ||
    targetPath === "catalog" ||
    targetPath.startsWith("catalog/") ||
    targetPath === "categories";

  if (!token && !isPublic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Client calls /api/lms/<rest> → Strapi /api/lms/<rest>
  let url: URL;
  try {
    url = new URL(`${getApiBaseUrl()}/lms/${targetPath}`);
  } catch {
    return NextResponse.json(
      { error: "Invalid API base URL configuration" },
      { status: 500 }
    );
  }
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) init.body = body;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), init);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Upstream fetch failed",
      },
      { status: 502 }
    );
  }
  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ||
      (payload as { message?: string })?.message ||
      "Request failed";
    return NextResponse.json({ error: message, details: payload }, { status: res.status });
  }

  return NextResponse.json(payload);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}
