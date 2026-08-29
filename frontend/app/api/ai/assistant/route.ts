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
    return NextResponse.json(
      {
        error:
          "Could not reach the API server. Restart the backend (npm run dev) if you're running locally, then try again.",
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

  const normalized = messages.map((m) => ({
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
  })).filter((m) => m.content || m.attachment);

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

  async function respondWithSage(source: "frontend-env" | "backend") {
    const result = await generateSageReply(trimmed, sageContext);
    return NextResponse.json({
      data: {
        role: "assistant",
        content: result.reply,
        provider: result.provider,
        assistantName: AI_ASSISTANT_NAME,
      },
      meta: { role, studentId: user.id, source },
    });
  }

  let localError: string | undefined;

  // 1) Local AI (frontend .env.local / Vercel) — fastest path for dev
  if (!hasAttachment && process.env.AGENTROUTER_API_KEY?.trim()) {
    try {
      return await respondWithSage("frontend-env");
    } catch (localErr) {
      localError = localErr instanceof Error ? localErr.message : "Local Sage failed";
    }
  }

  // 2) Strapi backend (Railway) — production keys live in backend/.env
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
    let data: unknown = null;
    const responseText = text.trim();
    if (responseText.startsWith("<")) {
      return NextResponse.json(
        {
          error:
            typeof localError === "string"
              ? `API server returned HTML instead of JSON. Local Sage error: ${localError}`
              : "API server returned HTML instead of JSON. Is Strapi running? Check NEXT_PUBLIC_API_URL and restart the backend.",
        },
        { status: 502 }
      );
    }
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
        error:
          typeof localError === "string"
            ? `${errMsg} (local: ${localError})`
            : errMsg,
      },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          typeof localError === "string"
            ? `Could not reach the API server. Local Sage error: ${localError}`
            : "Could not reach the API server. Is Strapi running?",
      },
      { status: 502 }
    );
  }
}
