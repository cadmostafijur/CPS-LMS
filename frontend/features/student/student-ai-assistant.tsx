"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Bot, Plus, Sparkles, ArrowUp, UserRound } from "lucide-react";
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

const IMAGE_UPLOAD_COMING_SOON =
  "Image upload is coming soon. For now, Sage supports text chat only — type your question below.";

function formatSageError(message: string): string {
  if (/GEMINI_API_KEY was rejected|API key not valid|API_KEY_INVALID|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(message)) {
    return "Gemini rejected the API key. Add GEMINI_API_KEY on Vercel → Settings → Environment Variables (Production), then Redeploy.";
  }
  if (/GEMINI_API_KEY not configured|not set on the server|not configured/i.test(message) && /GEMINI|Sage is not configured/i.test(message)) {
    return "Sage needs GEMINI_API_KEY on Vercel (Settings → Environment Variables → Production). Then Redeploy. Get a free key at aistudio.google.com/apikey";
  }
  if (/HTML|WAF|blocked|Agent Router/i.test(message)) {
    return "Sage needs GEMINI_API_KEY on Vercel (Settings → Environment Variables → Production), then Redeploy. Agent Router does not work from cloud servers.";
  }
  if (/Could not reach|NEXT_PUBLIC_API_URL|Railway backend/i.test(message)) {
    return "Cannot reach the API server. Check NEXT_PUBLIC_API_URL on Vercel points to your Railway URL ending in /api.";
  }
  if (/^unauthorized$/i.test(message.trim())) {
    return "Session expired. Sign out and sign in again as a student.";
  }
  return message;
}

function formatInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-navy">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={`${keyPrefix}-c-${match.index}`}
          className="rounded-md bg-navy/8 px-1.5 py-0.5 font-mono text-[0.85em] text-orange"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length ? parts : [text];
}

function SageMessageContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-navy/90">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim());
        const isBulletList = lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line));
        const isNumberedList = lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line));

        if (block.startsWith("### ")) {
          return (
            <h3 key={blockIndex} className="font-display text-base font-semibold text-navy">
              {formatInline(block.slice(4), `${blockIndex}-h3`)}
            </h3>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h2 key={blockIndex} className="font-display text-lg font-bold text-navy">
              {formatInline(block.slice(3), `${blockIndex}-h2`)}
            </h2>
          );
        }

        if (isBulletList) {
          return (
            <ul key={blockIndex} className="ml-4 list-disc space-y-1.5 marker:text-orange">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {formatInline(line.replace(/^[-*•]\s+/, ""), `${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol
              key={blockIndex}
              className="ml-4 list-decimal space-y-1.5 marker:font-semibold marker:text-orange"
            >
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {formatInline(line.replace(/^\d+\.\s+/, ""), `${blockIndex}-n-${lineIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {formatInline(line, `${blockIndex}-p-${lineIndex}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Hi! I'm ${AI_ASSISTANT_NAME}, your CPS Academy learning assistant. Ask me about your courses, tricky concepts, study plans, or how to stay on track — I'm here to guide you, not do the work for you.\n\nText chat is available now. Image upload is coming soon.`,
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function SageAskBar({
  value,
  onChange,
  onSend,
  pending,
  onAttachClick,
  inputRef,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  onAttachClick: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const canSend = Boolean(value.trim());

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-border/80 bg-[#eef0f3] px-2 py-2 shadow-sm transition-shadow focus-within:border-orange/30 focus-within:ring-2 focus-within:ring-orange/15"
        )}
      >
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-white hover:text-muted-foreground"
          aria-label="Image upload coming soon"
          title="Image upload coming soon"
          onClick={onAttachClick}
        >
          <Plus className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask anything"
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted-foreground disabled:opacity-60"
          aria-label={`Ask ${AI_ASSISTANT_NAME}`}
        />

        <div className="flex shrink-0 items-center gap-1.5 pr-0.5">
          <span className="hidden items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-orange" />
            {AI_ASSISTANT_NAME}
          </span>
          <button
            type="button"
            disabled={pending || !canSend}
            onClick={onSend}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white transition-opacity hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentAiAssistant({ studentName }: { studentName?: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>([WELCOME]);
  const requestIdRef = useRef(0);

  const firstName = useMemo(
    () => studentName?.split(" ")[0] || "there",
    [studentName]
  );

  const hasConversation = useMemo(
    () => messages.some((m) => m.role === "user"),
    [messages]
  );

  const threadMessages = useMemo(
    () => (hasConversation ? messages.filter((m) => m.id !== "welcome") : []),
    [messages, hasConversation]
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
    if (!hasConversation) return;
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending, hasConversation]);

  function toApiHistory(msgs: ChatMessage[]) {
    return msgs
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));
  }

  function handleAttachClick() {
    toast.info(IMAGE_UPLOAD_COMING_SOON);
  }

  function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || pending) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
    };
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
        toast.error(formatSageError(msg));
      }
    });
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl",
        !hasConversation &&
          "flex min-h-[calc(100dvh-11.5rem)] flex-col items-center justify-center md:min-h-[calc(100vh-8rem)]"
      )}
    >
      {hasConversation ? (
        <div className="flex h-[calc(100dvh-10.5rem)] flex-col md:h-[calc(100dvh-8.5rem)]">
          <div
            ref={threadRef}
            className="sage-thread-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-2 pb-2"
          >
            {threadMessages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={cn("flex items-start gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isUser ? "bg-navy/10 text-navy" : "bg-orange/15 text-orange"
                    )}
                  >
                    {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      "flex min-w-0 flex-col gap-1.5",
                      isUser ? "max-w-[min(100%,20rem)] items-end" : "max-w-[min(100%,34rem)] items-start"
                    )}
                  >
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {isUser ? "You" : AI_ASSISTANT_NAME}
                    </p>
                    <div
                      className={cn(
                        "w-fit rounded-2xl px-4 py-3 shadow-sm",
                        isUser
                          ? "rounded-tr-md bg-navy text-white"
                          : "rounded-tl-md border border-orange/15 bg-[#fffaf6]"
                      )}
                    >
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <SageMessageContent content={m.content} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {pending ? (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/15 text-orange">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-orange/15 bg-[#fffaf6] px-4 py-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-orange" />
                    Thinking…
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 space-y-2 border-t border-border/60 bg-surface/60 pt-3 backdrop-blur-sm">
            <p className="text-center text-[11px] text-muted-foreground">
              Text chat only · Image upload coming soon
            </p>
            <SageAskBar
              value={input}
              onChange={setInput}
              onSend={() => sendMessage()}
              pending={pending}
              onAttachClick={handleAttachClick}
              inputRef={inputRef}
            />
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-2xl flex-col items-center px-2">
          <h2 className="font-display text-center text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            What&apos;s on your mind today
            {firstName !== "there" ? (
              <>
                , <span className="text-orange">{firstName}</span>
              </>
            ) : null}
            ?
          </h2>
          {courses.length > 0 ? (
            <p className="mt-2 max-w-lg text-center text-sm text-muted-foreground">
              Ask about {courses.slice(0, 2).join(", ")}
              {courses.length > 2 ? "…" : ""}
            </p>
          ) : null}

          <p className="mt-4 rounded-full border border-border/80 bg-white px-3 py-1 text-xs text-muted-foreground">
            Text chat only · Image upload coming soon
          </p>

          <SageAskBar
            className="mt-6 w-full"
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            pending={pending}
            onAttachClick={handleAttachClick}
            inputRef={inputRef}
          />

          <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                disabled={pending}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-orange/40 hover:bg-orange/5 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
