"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Bot, Plus, Sparkles, ArrowUp, UserRound, X, FileText } from "lucide-react";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { AI_ASSISTANT_NAME } from "@/lib/ai/sage";
import { cn } from "@/lib/utils";

type SageAttachment = {
  name: string;
  mimeType: string;
  kind: "image" | "pdf";
  dataBase64: string;
  previewUrl?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachment?: SageAttachment;
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

const SAGE_MAX_FILE_BYTES = 4 * 1024 * 1024;

async function readSageAttachment(file: File): Promise<SageAttachment> {
  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isImage && !isPdf) {
    throw new Error("Sage accepts images and PDF files only.");
  }
  if (file.size > SAGE_MAX_FILE_BYTES) {
    throw new Error("File must be under 4 MB.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop()! : dataUrl;

  return {
    name: file.name,
    mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
    kind: isPdf ? "pdf" : "image",
    dataBase64: base64,
    previewUrl: isImage ? dataUrl : undefined,
  };
}

function formatSageError(message: string): string {
  if (/unauthorized client/i.test(message)) {
    return `${message} Redeploy the Railway backend after setting AGENTROUTER_API_KEY.`;
  }
  if (/not set|not configured/i.test(message)) {
    return `${message} Set AGENTROUTER_API_KEY on Railway (backend), not Vercel.`;
  }
  if (/GEMINI_API_KEY|text-only|does not support image|vision/i.test(message)) {
    return message.includes("aistudio.google.com")
      ? message
      : `${message} Add GEMINI_API_KEY on Railway for image/PDF reading (free: https://aistudio.google.com/apikey).`;
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
  content: `Hi! I'm ${AI_ASSISTANT_NAME}, your CPS Academy learning assistant. Ask me about your courses, tricky concepts, study plans, or how to stay on track — I'm here to guide you, not do the work for you.`,
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function SageAskBar({
  value,
  onChange,
  onSend,
  pending,
  inputRef,
  fileInputRef,
  onPickFile,
  attachment,
  onClearAttachment,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  onPickFile: (file: File | null) => void;
  attachment?: SageAttachment | null;
  onClearAttachment: () => void;
  className?: string;
}) {
  const canSend = Boolean(value.trim() || attachment);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {attachment ? (
        <div className="flex items-center gap-2 rounded-xl border border-orange/20 bg-orange/5 px-3 py-2">
          {attachment.kind === "image" && attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.previewUrl}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-orange">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-navy">{attachment.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {attachment.kind === "image" ? "Image attached" : "PDF attached"} — Sage will analyze it
            </p>
          </div>
          <button
            type="button"
            onClick={onClearAttachment}
            className="rounded-full p-1 text-muted-foreground hover:bg-white hover:text-navy"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-border/80 bg-[#eef0f3] px-2 py-2 shadow-sm transition-shadow focus-within:border-orange/30 focus-within:ring-2 focus-within:ring-orange/15"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            onPickFile(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white hover:text-navy"
          aria-label="Attach image or PDF"
          onClick={() => fileInputRef?.current?.click()}
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
          placeholder={attachment ? "Ask about this file…" : "Ask anything"}
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
  const [pendingAttachment, setPendingAttachment] = useState<SageAttachment | null>(null);
  const [courses, setCourses] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const filtered = msgs.filter((m) => m.id !== "welcome");
    return filtered.map((m, index) => {
      const isLast = index === filtered.length - 1;
      const base: {
        role: "user" | "assistant";
        content: string;
        attachment?: {
          name: string;
          mimeType: string;
          kind: "image" | "pdf";
          dataBase64: string;
        };
      } = {
        role: m.role,
        content: m.content,
      };
      if (isLast && m.role === "user" && m.attachment) {
        base.attachment = {
          name: m.attachment.name,
          mimeType: m.attachment.mimeType,
          kind: m.attachment.kind,
          dataBase64: m.attachment.dataBase64,
        };
      } else if (m.attachment) {
        base.content =
          m.content ||
          `[Shared ${m.attachment.kind === "pdf" ? "PDF" : "image"}: ${m.attachment.name}]`;
      }
      return base;
    });
  }

  async function handlePickFile(file: File | null) {
    if (!file) return;
    try {
      const attachment = await readSageAttachment(file);
      setPendingAttachment(attachment);
      if (!input.trim()) {
        setInput(
          attachment.kind === "pdf"
            ? "Explain this PDF in simple terms"
            : "What do you see in this image? Help me understand it"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not attach file");
    }
  }

  function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim();
    const attachment = pendingAttachment;
    if ((!trimmed && !attachment) || pending) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content:
        trimmed ||
        (attachment?.kind === "pdf"
          ? "Please explain this PDF"
          : "Please explain this image"),
      attachment: attachment || undefined,
    };
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setInput("");
    setPendingAttachment(null);

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
        <>
          <div
            ref={threadRef}
            className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto pr-1 sm:max-h-[calc(100vh-11rem)]"
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
                      <div className="space-y-2">
                        {m.attachment?.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.attachment.previewUrl}
                            alt={m.attachment.name}
                            className="max-h-48 rounded-lg object-cover"
                          />
                        ) : null}
                        {m.attachment?.kind === "pdf" ? (
                          <p className="inline-flex items-center gap-1.5 text-xs text-white/80">
                            <FileText className="h-3.5 w-3.5" />
                            {m.attachment.name}
                          </p>
                        ) : null}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
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

          <div className="mt-3 border-t border-border/60 pt-3">
            <SageAskBar
              value={input}
              onChange={setInput}
              onSend={() => sendMessage()}
              pending={pending}
              inputRef={inputRef}
              fileInputRef={fileInputRef}
              onPickFile={handlePickFile}
              attachment={pendingAttachment}
              onClearAttachment={() => setPendingAttachment(null)}
            />
          </div>
        </>
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

          <SageAskBar
            className="mt-8 w-full"
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            pending={pending}
            inputRef={inputRef}
            fileInputRef={fileInputRef}
            onPickFile={handlePickFile}
            attachment={pendingAttachment}
            onClearAttachment={() => setPendingAttachment(null)}
          />

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Tap <span className="font-medium text-navy">+</span> to attach an image or PDF for Sage to explain
          </p>

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
