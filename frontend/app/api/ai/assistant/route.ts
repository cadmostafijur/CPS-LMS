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

function envSet(name: string) {
  const v = process.env[name];
  return Boolean(v?.trim());
}

function hasFrontendAiKey() {
  return envSet("GEMINI_API_KEY") || envSet("AGENTROUTER_API_KEY") || envSet("OPENAI_API_KEY");
}

/** Try Railway backend first when Vercel has no Gemini key (backend may have it). */
function preferBackendFirst() {
  return !envSet("GEMINI_API_KEY");
}

async function callFrontendSage(
  messages: ChatMessage[],
  context: { studentName?: string | null; enrolledCourses?: string[] | undefined },
  role: string,
  studentId: string | number
) {
  const result = await generateSageReply(messages, context);
  return NextResponse.json({
    data: {
      role: "assistant",
      content: result.reply,
      provider: result.provider,
      assistantName: AI_ASSISTANT_NAME,
    },
    meta: { role, studentId, source: "frontend-env" },
  });
}

async function callBackendSage(
  token: string,
  messages: ChatMessage[],
  enrolledCourses: string[] | undefined
): Promise<{ ok: true; body: unknown } | { ok: false; status: number; error: string }> {
  const upstream = await fetch(`${getApiBaseUrl()}/lms/ai/assistant`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      context: { enrolledCourses },
    }),
    cache: "no-store",
  });

  const text = (await upstream.text()).trim();

  if (text.startsWith("<")) {
    return {
      ok: false,
      status: 502,
      error: "Backend returned HTML instead of JSON. Check NEXT_PUBLIC_API_URL on Vercel.",
    };
  }

  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return { ok: false, status: 502, error: "Invalid response from API server." };
  }

  if (upstream.ok) {
    return { ok: true, body: data };
  }

  const errMsg =
    (data as { error?: { message?: string } })?.error?.message ||
    (data as { error?: string })?.error ||
    (data as { message?: string })?.message ||
    "Sage AI unavailable on server";

  return {
    ok: false,
    status: upstream.status >= 400 ? upstream.status : 502,
    error: errMsg,
  };
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
  const errors: string[] = [];

  const tryFrontend = async () => {
    if (hasAttachment || !hasFrontendAiKey()) return null;
    try {
      return await callFrontendSage(trimmed, sageContext, role ?? "student", user.id);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Frontend Sage failed");
      return null;
    }
  };

  const tryBackend = async () => {
    try {
      const result = await callBackendSage(token, trimmed, body.context?.enrolledCourses);
      if (result.ok) {
        return NextResponse.json(result.body);
      }
      errors.push(result.error);
      return null;
    } catch {
      errors.push("Could not reach Railway backend for Sage");
      return null;
    }
  };

  // Attachments always go through backend (vision/Gemini).
  if (hasAttachment) {
    const backendRes = await tryBackend();
    if (backendRes) return backendRes;
    return NextResponse.json(
      { error: errors[0] || "Sage could not process the attachment." },
      { status: 502 }
    );
  }

  // Agent Router from Vercel is unreliable — try Railway first when only that key is on Vercel.
  if (preferBackendFirst()) {
    const backendRes = await tryBackend();
    if (backendRes) return backendRes;
    const frontendRes = await tryFrontend();
    if (frontendRes) return frontendRes;
  } else {
    const frontendRes = await tryFrontend();
    if (frontendRes) return frontendRes;
    const backendRes = await tryBackend();
    if (backendRes) return backendRes;
  }

  const unique = [...new Set(errors.filter(Boolean))];
  return NextResponse.json(
    {
      error:
        unique.join(" · ") ||
        "Sage is not configured. Add GEMINI_API_KEY (free at aistudio.google.com/apikey) on Vercel and Railway, then redeploy.",
    },
    { status: 502 }
  );
}
