import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchStrapiMe, TOKEN_COOKIE } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/config";
import { getRoleName, isStudent } from "@/lib/roles";
import { generateSageReply, AI_ASSISTANT_NAME, MAX_CHAT_HISTORY, type ChatMessage } from "@/lib/ai/sage";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user;
  try {
    user = await fetchStrapiMe(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStudent(user)) {
    return NextResponse.json(
      { error: "AI assistant is available for student accounts only." },
      { status: 403 }
    );
  }

  let body: {
    messages?: ChatMessage[];
    context?: { enrolledCourses?: string[] };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = (body.messages || []).filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
  );

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "Send at least one user message." },
      { status: 400 }
    );
  }

  const trimmed = messages.slice(-MAX_CHAT_HISTORY);
  const role = getRoleName(user);
  const payload = JSON.stringify({
    messages: trimmed,
    context: {
      enrolledCourses: body.context?.enrolledCourses,
    },
  });

  // Prefer Strapi backend (Railway) — API keys live in backend .env
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/lms/ai/assistant`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: payload,
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || "Invalid response from API" };
    }

    if (upstream.ok) {
      return NextResponse.json(data);
    }

    const errMsg =
      (data as { error?: { message?: string } })?.error?.message ||
      (data as { error?: string })?.error ||
      (data as { message?: string })?.message ||
      "Sage AI unavailable on server";

    // If backend has no key, try local frontend env (dev fallback)
    if (upstream.status !== 401 && upstream.status !== 403) {
      const local = await tryLocalSage(trimmed, user, body.context?.enrolledCourses);
      if (local) {
        return NextResponse.json({
          data: {
            role: "assistant",
            content: local.reply,
            provider: local.provider,
            assistantName: AI_ASSISTANT_NAME,
          },
          meta: { role, studentId: user.id, source: "frontend-env" },
        });
      }
      return NextResponse.json({ error: errMsg }, { status: upstream.status });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    const local = await tryLocalSage(trimmed, user, body.context?.enrolledCourses);
    if (local) {
      return NextResponse.json({
        data: {
          role: "assistant",
          content: local.reply,
          provider: local.provider,
          assistantName: AI_ASSISTANT_NAME,
        },
        meta: { role, studentId: user.id, source: "frontend-env" },
      });
    }
    return NextResponse.json(
      { error: "Could not reach the API server. Is Strapi running?" },
      { status: 502 }
    );
  }
}

async function tryLocalSage(
  messages: ChatMessage[],
  user: { name?: string | null; username?: string | null },
  enrolledCourses?: string[]
) {
  if (!process.env.AGENTROUTER_API_KEY?.trim()) return null;
  try {
    return await generateSageReply(messages, {
      studentName: user.name || user.username,
      enrolledCourses,
    });
  } catch {
    return null;
  }
}
