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

function hasFrontendAiKey() {
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.AGENTROUTER_API_KEY?.trim() ||
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
          "Could not reach the API server. Check NEXT_PUBLIC_API_URL (must end with /api).",
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

  // Run on Vercel when any AI key is set (Gemini recommended for production).
  if (!hasAttachment && hasFrontendAiKey()) {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sage failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // No keys on Vercel — try Railway backend once.
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/lms/ai/assistant`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: trimmed,
        context: { enrolledCourses: body.context?.enrolledCourses },
      }),
      cache: "no-store",
    });

    const text = await upstream.text();
    const responseText = text.trim();

    if (responseText.startsWith("<")) {
      return NextResponse.json(
        {
          error:
            "Backend returned HTML. Check NEXT_PUBLIC_API_URL on Vercel, or add GEMINI_API_KEY on Vercel and redeploy.",
        },
        { status: 502 }
      );
    }

    let data: unknown = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      return NextResponse.json(
        { error: "Invalid response from API server." },
        { status: 502 }
      );
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
      { error: errMsg },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Sage is not configured. Add GEMINI_API_KEY (free at aistudio.google.com/apikey) on Vercel → Environment Variables, then redeploy.",
      },
      { status: 502 }
    );
  }
}
