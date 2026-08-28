"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Bot, UserRound } from "lucide-react";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { AI_ASSISTANT_NAME } from "@/lib/ai/sage";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type CourseRow = {
  course?: { title?: string | null } | null;
  title?: string | null;
};

const SUGGESTIONS = [
  "Explain this week's topic in simple terms",
  "How should I study for my next quiz?",
  "Give me a 3-step plan to finish my course",
  "What are good note-taking tips?",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Hi! I'm ${AI_ASSISTANT_NAME}, your CPS Academy learning assistant. Ask me about your courses, tricky concepts, study plans, or how to stay on track — I'm here to guide you, not do the work for you.`,
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StudentAiAssistant({ studentName }: { studentName?: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([WELCOME]);
  const requestIdRef = useRef(0);

  const firstName = useMemo(
    () => studentName?.split(" ")[0] || "there",
    [studentName]
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const res = await bffFetch<{ data: CourseRow[] }>("/api/lms/my-courses");
        const titles = (res.data || [])
          .map((row) => row.course?.title || row.title)
          .filter((t): t is string => Boolean(t));
        setCourses(titles);
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  function toApiHistory(msgs: ChatMessage[]) {
    return msgs
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setInput("");

    const requestId = ++requestIdRef.current;
    const history = toApiHistory(nextMessages);

    startTransition(async () => {
      try {
        const res = await bffFetch<{
          data: { content: string; provider?: string };
        }>("/api/ai/assistant", {
          method: "POST",
          body: JSON.stringify({
            messages: history,
            context: { enrolledCourses: courses },
          }),
        });

        if (requestId !== requestIdRef.current) return;

        const assistantMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: res.data.content,
        };
        const withReply = [...messagesRef.current, assistantMsg];
        messagesRef.current = withReply;
        setMessages(withReply);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : `${AI_ASSISTANT_NAME} could not respond`;
        toast.error(
          msg.includes("AGENTROUTER") || msg.includes("API")
            ? msg
            : `${msg}. If this persists, check AGENTROUTER_API_KEY in frontend env (Vercel).`
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-orange/20 bg-gradient-to-br from-navy via-navy to-[#1e3a5f] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-orange/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200">
            <Sparkles className="h-3.5 w-3.5" />
            Your AI assistant
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ask anything,
            <br />
            <span className="text-orange">learn everything</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Ask questions, get guided answers, and continue your learning journey
            with <span className="font-semibold text-white">{AI_ASSISTANT_NAME}</span> in one
            place.
          </p>
          <p className="mt-4 text-sm text-white/70">
            Welcome back, {firstName}. I can help with your enrolled courses
            {courses.length ? `: ${courses.slice(0, 2).join(", ")}${courses.length > 2 ? "…" : ""}` : ""}.
          </p>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div
          ref={threadRef}
          className="max-h-[min(58vh,560px)] min-h-[320px] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fafbfc_0%,#ffffff_100%)] px-4 py-5 sm:px-6"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isUser ? "bg-navy/10 text-navy" : "bg-orange/15 text-orange"
                  )}
                >
                  {isUser ? (
                    <UserRound className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "rounded-tr-md bg-navy text-white"
                      : "rounded-tl-md border border-border bg-white text-navy"
                  )}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    {isUser ? "You" : AI_ASSISTANT_NAME}
                  </p>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            );
          })}

          {pending ? (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange/15 text-orange">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
                {AI_ASSISTANT_NAME} is thinking…
              </div>
            </div>
          ) : null}
        </div>

        {messages.length <= 1 ? (
          <div className="flex flex-wrap gap-2 border-t border-border/70 bg-surface/30 px-4 py-3 sm:px-6">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-orange/40 hover:bg-orange/5"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-t border-border/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Textarea
              placeholder={`Ask ${AI_ASSISTANT_NAME} anything about your learning…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={2}
              className="min-h-[72px] resize-none bg-surface/30 sm:flex-1"
            />
            <Button
              type="button"
              disabled={pending || !input.trim()}
              onClick={() => sendMessage(input)}
              className="shrink-0 gap-2 sm:min-w-[120px]"
            >
              <Send className="h-4 w-4" />
              Ask {AI_ASSISTANT_NAME}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {AI_ASSISTANT_NAME} guides your learning — it won&apos;t complete graded work for you.
          </p>
        </div>
      </div>
    </div>
  );
}
