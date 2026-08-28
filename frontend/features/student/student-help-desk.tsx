"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  Bug,
  CheckCircle2,
  Grid3X3,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

export type HelpDeskPost = {
  id: string | number;
  documentId?: string;
  kind: "post" | "announcement";
  title?: string | null;
  body: string;
  category: string;
  isResolved: boolean;
  createdAt?: string;
  author?: { name?: string | null; email?: string | null } | null;
  isStaffPost: boolean;
  isMine: boolean;
  commentCount: number;
  course?: { id: string | number; title?: string | null; slug?: string | null } | null;
  replies?: {
    id: string | number;
    body: string;
    createdAt?: string;
    author?: { name?: string | null; email?: string | null } | null;
  }[];
};

type CategoryKey =
  | "all"
  | "courses"
  | "bugs"
  | "feature"
  | "others"
  | "announcements"
  | "resolved";

type FilterKey = "all" | "mine" | "admin";

const CATEGORY_META: Record<
  Exclude<CategoryKey, "all">,
  { label: string; icon: typeof BookOpen; tone: string }
> = {
  courses: { label: "Course topics", icon: BookOpen, tone: "text-orange bg-orange/10" },
  bugs: { label: "Bugs", icon: Bug, tone: "text-red-600 bg-red-50" },
  feature: { label: "Feature requests", icon: Lightbulb, tone: "text-navy bg-navy/10" },
  others: { label: "Others", icon: Grid3X3, tone: "text-muted-foreground bg-surface" },
  announcements: { label: "Announcements", icon: Megaphone, tone: "text-emerald-700 bg-emerald-50" },
  resolved: { label: "Resolved", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
};

function when(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function initials(name?: string | null, email?: string | null) {
  const src = name || email || "U";
  return src
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function authorLabel(a?: { name?: string | null; email?: string | null } | null) {
  return a?.name || a?.email || "Member";
}

function excerpt(text: string, max = 140) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function StudentHelpDesk({
  studentName,
}: {
  studentName?: string | null;
}) {
  const [posts, setPosts] = useState<HelpDeskPost[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<{ id: string | number; title?: string | null }[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [postCategory, setPostCategory] = useState("courses");
  const [courseId, setCourseId] = useState("");
  const [active, setActive] = useState<HelpDeskPost | null>(null);
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{
          data: HelpDeskPost[];
          meta?: {
            counts?: Record<string, number>;
            courses?: { id: string | number; title?: string | null }[];
          };
        }>("/api/lms/helpdesk/posts");
        setPosts(res.data || []);
        setCounts(res.meta?.counts || {});
        const list = res.meta?.courses || [];
        setCourses(list);
        if (!courseId && list[0]?.id) setCourseId(String(list[0].id));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load Help Desk");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    let list = [...posts];
    if (filter === "mine") list = list.filter((p) => p.isMine);
    if (filter === "admin") list = list.filter((p) => p.isStaffPost);
    if (category === "resolved") list = list.filter((p) => p.isResolved);
    else if (category !== "all") list = list.filter((p) => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          authorLabel(p.author).toLowerCase().includes(q) ||
          (p.course?.title || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, filter, category, search]);

  function createPost() {
    if (!draft.trim()) {
      toast.error("Write something to share first");
      return;
    }
    if (!courseId) {
      toast.error("Enroll in a course before posting");
      return;
    }
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: HelpDeskPost }>("/api/lms/helpdesk/posts", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim() || undefined,
            body: draft.trim(),
            category: postCategory,
            courseId,
          }),
        });
        setPosts((prev) => [res.data, ...prev]);
        setDraft("");
        setTitle("");
        toast.success("Post created");
        load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not create post");
      }
    });
  }

  function sendReply() {
    if (!active || active.kind !== "post" || !reply.trim()) return;
    const threadId = active.documentId || active.id;
    startTransition(async () => {
      try {
        const res = await bffFetch<{
          data: NonNullable<HelpDeskPost["replies"]>[number];
        }>(`/api/lms/discussions/${threadId}/replies`, {
          method: "POST",
          body: JSON.stringify({ body: reply.trim() }),
        });
        const updated = {
          ...active,
          commentCount: active.commentCount + 1,
          replies: [...(active.replies || []), res.data],
        };
        setActive(updated);
        setPosts((prev) =>
          prev.map((p) =>
            String(p.documentId || p.id) === String(threadId) ? updated : p
          )
        );
        setReply("");
        toast.success("Reply posted");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not reply");
      }
    });
  }

  const myInitials = initials(studentName, null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange">
            Community
          </p>
          <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">
            Help Desk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share questions, get answers, and learn together at CPS Academy.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-orange/30 bg-orange/5 text-navy">
          <Sparkles className="h-3.5 w-3.5 text-orange" />
          By CPS Academy
        </Badge>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-orange/15 text-sm text-orange">
              {myInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="bg-surface/40"
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share or ask something to everyone…"
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-surface/40 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange/30"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={postCategory} onValueChange={setPostCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courses">Course topics</SelectItem>
                      <SelectItem value="bugs">Bugs</SelectItem>
                      <SelectItem value="feature">Feature request</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {c.title || "Course"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                disabled={pending || !draft.trim() || !courseId}
                onClick={createPost}
                className="shrink-0"
              >
                Create post
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All posts"],
                  ["mine", "My posts"],
                  ["admin", "Admin posts"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    filter === key
                      ? "bg-navy text-white"
                      : "border border-border bg-white text-muted-foreground hover:text-navy"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative min-w-[200px] flex-1 sm:w-64 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts…"
                  className="bg-white pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={load}
                disabled={pending}
                aria-label="Refresh"
              >
                <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
              </Button>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No posts yet"
              description="Be the first to start a conversation in the Help Desk."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((post) => {
                const cat = CATEGORY_META[post.category as Exclude<CategoryKey, "all">];
                const CatIcon = cat?.icon || Grid3X3;
                return (
                  <button
                    key={String(post.id)}
                    type="button"
                    onClick={() => setActive(post)}
                    className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-orange/10 text-xs text-orange">
                            {initials(post.author?.name, post.author?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-navy">
                            {authorLabel(post.author)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {when(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      {post.isResolved ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Resolved
                        </Badge>
                      ) : post.kind === "announcement" ? (
                        <Badge className="shrink-0 bg-emerald-50 text-[10px] text-emerald-700">
                          Announcement
                        </Badge>
                      ) : null}
                    </div>

                    <h3 className="mt-4 line-clamp-2 font-display text-base font-semibold text-navy">
                      {post.title || excerpt(post.body, 72)}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {excerpt(post.body)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
                      </span>
                      {post.course?.title ? (
                        <Badge variant="outline" className="text-[10px]">
                          {post.course.title}
                        </Badge>
                      ) : null}
                      {cat ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
                            cat.tone
                          )}
                        >
                          <CatIcon className="h-3 w-3" />
                          {cat.label}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <h2 className="font-display text-sm font-semibold text-navy">Categories</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    category === "all"
                      ? "bg-orange/10 font-medium text-orange"
                      : "text-muted-foreground hover:bg-surface"
                  )}
                >
                  <span>All posts</span>
                  <span>{posts.length}</span>
                </button>
              </li>
              {(
                Object.entries(CATEGORY_META) as [
                  Exclude<CategoryKey, "all">,
                  (typeof CATEGORY_META)[Exclude<CategoryKey, "all">],
                ][]
              ).map(([key, meta]) => {
                const Icon = meta.icon;
                const count = counts[key] ?? 0;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setCategory(key)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                        category === key
                          ? "bg-orange/10 font-medium text-orange"
                          : "text-muted-foreground hover:bg-surface"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg",
                            meta.tone
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {meta.label}
                      </span>
                      <span>{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-navy">
                  {active.title || "Discussion"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {authorLabel(active.author)} · {when(active.createdAt)}
                  {active.course?.title ? ` · ${active.course.title}` : ""}
                </p>
              </DialogHeader>

              <div className="rounded-xl bg-surface/60 px-4 py-3 text-sm whitespace-pre-wrap text-navy">
                {active.body}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-navy">
                  {active.commentCount} comment{active.commentCount === 1 ? "" : "s"}
                </h4>
                {(active.replies || []).map((r) => (
                  <div
                    key={String(r.id)}
                    className="rounded-xl border border-border bg-white px-4 py-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {authorLabel(r.author)} · {when(r.createdAt)}
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{r.body}</p>
                  </div>
                ))}

                {active.kind === "post" ? (
                  <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                    <Input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <Button type="button" disabled={pending} onClick={sendReply}>
                      Reply
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Announcements are read-only. Reply on the related course page if you have
                    questions.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
