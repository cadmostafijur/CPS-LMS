"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";

export type DiscussionReply = {
  id: number | string;
  documentId?: string;
  body: string;
  createdAt?: string;
  author?: { name?: string | null; email?: string | null } | null;
};

export type DiscussionThread = {
  id: number | string;
  documentId?: string;
  title?: string | null;
  body: string;
  createdAt?: string;
  author?: { name?: string | null; email?: string | null } | null;
  replies?: DiscussionReply[];
};

function when(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function authorLabel(a?: { name?: string | null; email?: string | null } | null) {
  return a?.name || a?.email || "Member";
}

export function CourseDiscussions({
  courseId,
  canPost,
  initialThreads = [],
}: {
  courseId: string | number;
  canPost: boolean;
  initialThreads?: DiscussionThread[];
}) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function postThread() {
    if (!body.trim()) {
      toast.error("Write a question or comment first");
      return;
    }
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: DiscussionThread }>(
          `/api/lms/courses/${courseId}/discussions`,
          {
            method: "POST",
            body: JSON.stringify({ title, body }),
          }
        );
        setThreads((prev) => [res.data, ...prev]);
        setTitle("");
        setBody("");
        toast.success("Posted to discussion");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not post");
      }
    });
  }

  function postReply(threadId: string | number) {
    const key = String(threadId);
    const text = (replyDrafts[key] || "").trim();
    if (!text) {
      toast.error("Write a reply first");
      return;
    }
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: DiscussionReply }>(
          `/api/lms/discussions/${threadId}/replies`,
          {
            method: "POST",
            body: JSON.stringify({ body: text }),
          }
        );
        setThreads((prev) =>
          prev.map((t) =>
            String(t.documentId || t.id) === key
              ? { ...t, replies: [...(t.replies || []), res.data] }
              : t
          )
        );
        setReplyDrafts((d) => ({ ...d, [key]: "" }));
        toast.success("Reply posted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not reply");
      }
    });
  }

  return (
    <section id="discussions" className="mt-10 scroll-mt-24">
      <h2 className="font-display text-xl font-semibold text-navy">
        Course discussion
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask questions and reply — enrolled students and course staff only.
      </p>

      {canPost ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="disc-title">Title (optional)</Label>
            <Input
              id="disc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short topic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disc-body">Your post</Label>
            <textarea
              id="disc-body"
              className="min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange/40"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ask a question or share a note…"
            />
          </div>
          <Button type="button" disabled={pending} onClick={postThread}>
            Post
          </Button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          Enroll as a student to join the discussion.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No posts yet"
            description="Be the first to start a thread for this course."
          />
        ) : (
          threads.map((t) => {
            const key = String(t.documentId || t.id);
            return (
              <article
                key={key}
                className="rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display font-semibold text-navy">
                    {t.title || "Discussion"}
                  </p>
                  <p className="text-xs text-muted-foreground">{when(t.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {authorLabel(t.author)}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                  {t.body}
                </p>

                <div className="mt-4 space-y-3 border-t border-border pt-3">
                  {(t.replies || []).map((r) => (
                    <div
                      key={String(r.documentId || r.id)}
                      className="rounded-xl bg-surface/80 px-3 py-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        {authorLabel(r.author)} · {when(r.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{r.body}</p>
                    </div>
                  ))}

                  {canPost ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={replyDrafts[key] || ""}
                        onChange={(e) =>
                          setReplyDrafts((d) => ({ ...d, [key]: e.target.value }))
                        }
                        placeholder="Write a reply…"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pending}
                        onClick={() => postReply(t.documentId || t.id)}
                      >
                        Reply
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
