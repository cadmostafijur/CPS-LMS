import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchStrapiMe, TOKEN_COOKIE } from "@/lib/auth";
import { getRoleName, isStudent } from "@/lib/roles";
import { generateErsaReply, type ChatMessage } from "@/lib/ai/ersa";

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

  const trimmed = messages.slice(-12);
  const role = getRoleName(user);

  try {
    const { reply, provider } = await generateErsaReply(trimmed, {
      studentName: user.name || user.username,
      enrolledCourses: body.context?.enrolledCourses,
    });

    return NextResponse.json({
      data: {
        role: "assistant",
        content: reply,
        provider,
        assistantName: "Ersa",
      },
      meta: { role, studentId: user.id },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Assistant unavailable",
      },
      { status: 502 }
    );
  }
}
