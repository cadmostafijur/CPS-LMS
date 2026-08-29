import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchStrapiMe, TOKEN_COOKIE } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/config";
import { getRoleName, isStudent } from "@/lib/roles";
import {
  generateSageReply,
  AI_ASSISTANT_NAME,
  MAX_CHAT_HISTORY,
  type ChatMessage,
} from "@/lib/ai/sage";
import type { AuthUser } from "@/types";

function hasAnyAiKey() {
  return Boolean(
    process.env.AGENTROUTER_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim()
  );
}

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user: AuthUser;
  try {
    user = await fetchStrapiMe(token);
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not reach the API server. Check NEXT_PUBLIC_API_URL (must end with /api) and that Strapi/Railway is running.",
      },
      { status: 502 }
    );
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
      (typeof m.content === "string" || m.attachment)
  );

  const normalized = messages
    .map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content.trim() : "",
      ...(m.attachment?.dataBase64
        ? {
            attachment: {
              name: m.attachment.name,
              mimeType: m.attachment.mimeType,
              kind: m.attachment.kind,
              dataBase64: m.attachment.dataBase64,
            },
          }
        : {}),
    }))
    .filter((m) => m.content || m.attachment);

  if (!normalized.length || normalized[normalized.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "Send at least one user message." },
      { status: 400 }
    );
  }

  const trimmed = normalized.slice(-MAX_CHAT_HISTORY);
  const role = getRoleName(user);
  const sageContext = {
    studentName: user.name || user.username,
    enrolledCourses: body.context?.enrolledCourses,
  };
  const hasAttachment = trimmed.some((m) => m.attachment?.dataBase64);

  let localError: string | undefined;

  // Prefer Next.js env (Vercel / .env.local) for text chat — no Strapi hop needed.
  if (!hasAttachment && hasAnyAiKey()) {
    try {
      const result = await generateSageReply(trimmed, sageContext);
      return NextResponse.json({
        data: {
          role: "assistant",
          content: result.reply,
          provider: result.provider,
          assistantName: AI_ASSISTANT_NAME,
        },
        meta: { role, studentId: user.id, source: "frontend-env" },
      });
    } catch (localErr) {
      localError =
        localErr instanceof Error ? localErr.message : "Local Sage failed";
    }
  }

  // Fallback: Strapi on Railway (AGENTROUTER_* in backend/.env)
  const payload = JSON.stringify({
    messages: trimmed,
    context: { enrolledCourses: body.context?.enrolledCourses },
  });

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
    const responseText = text.trim();

    if (responseText.startsWith("<")) {
      return NextResponse.json(
        {
          error: localError
            ? `Backend returned HTML (check NEXT_PUBLIC_API_URL). Also: ${localError}`
            : "Backend returned HTML instead of JSON. Set AGENTROUTER_API_KEY on Vercel (server env) OR on Railway, and confirm NEXT_PUBLIC_API_URL points to your Strapi /api URL.",
        },
        { status: 502 }
      );
    }

    let data: unknown = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
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

    return NextResponse.json(
      {
        error: localError ? `${errMsg} (frontend: ${localError})` : errMsg,
      },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  } catch {
    if (localError) {
      return NextResponse.json(
        { error: `Could not reach Strapi. Frontend Sage error: ${localError}` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Sage is not configured. Add AGENTROUTER_API_KEY to Vercel (frontend project, Production) and redeploy — or set it on Railway (backend) and keep NEXT_PUBLIC_API_URL correct.",
      },
      { status: 502 }
    );
  }
}
