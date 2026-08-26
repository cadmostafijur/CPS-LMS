"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { bffFetch, ApiError } from "@/lib/api";
import type { Course, Lesson, Quiz } from "@/types";

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function renderLessonHtml(content: string) {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withInline = escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return withInline
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines[0]?.startsWith("### ")) {
        return `<h3>${lines[0].slice(4)}</h3>${lines
          .slice(1)
          .map((l) => `<p>${l}</p>`)
          .join("")}`;
      }
      if (lines[0]?.startsWith("## ")) {
        return `<h2>${lines[0].slice(3)}</h2>${lines
          .slice(1)
          .map((l) => (l ? `<p>${l}</p>` : ""))
          .join("")}`;
      }
      if (lines[0]?.startsWith("# ")) {
        return `<h2>${lines[0].slice(2)}</h2>${lines
          .slice(1)
          .map((l) => (l ? `<p>${l}</p>` : ""))
          .join("")}`;
      }
      return `<p>${lines.join("<br />")}</p>`;
    })
    .join("");
}

export function LearningPlayer({
  course,
  lesson,
  completedLessonIds,
  progressPercent,
}: {
  course: Course;
  lesson: Lesson;
  completedLessonIds: Array<string | number>;
  progressPercent: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lessons = [...(course.lessons || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const quizzes = course.quizzes || [];
  const courseId = course.documentId || course.id;
  const currentId = lesson.documentId || lesson.id;
  const index = lessons.findIndex(
    (l) => String(l.documentId || l.id) === String(currentId)
  );
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const completed = completedLessonIds.some(
    (id) => String(id) === String(currentId)
  );
  const embedUrl = lesson.videoUrl ? toYouTubeEmbed(lesson.videoUrl) : null;

  function go(target: Lesson) {
    router.push(`/learn/${courseId}/${target.documentId || target.id}`);
  }

  function markComplete() {
    startTransition(async () => {
      try {
        await bffFetch(`/api/lms/lessons/${currentId}/complete`, {
          method: "POST",
        });
        toast.success("Lesson marked complete");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Could not mark complete"
        );
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1400px] flex-col md:flex-row">
      <aside className="w-full border-b border-border bg-card md:w-72 md:border-b-0 md:border-r">
        <div className="space-y-3 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Course
            </p>
            <h1 className="font-display text-base font-semibold leading-snug text-navy">
              {course.title}
            </h1>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
          <nav className="space-y-1">
            {lessons.map((item, i) => {
              const id = item.documentId || item.id;
              const active = String(id) === String(currentId);
              const done = completedLessonIds.some((x) => String(x) === String(id));
              return (
                <Link
                  key={String(id)}
                  href={`/learn/${courseId}/${id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-orange/10 text-orange"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <span className="w-4 text-center text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                  <span className="line-clamp-2">{item.title}</span>
                </Link>
              );
            })}
          </nav>
          {quizzes.length > 0 ? (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quizzes
              </p>
              <div className="space-y-1">
                {quizzes.map((quiz: Quiz) => (
                  <Link
                    key={String(quiz.documentId || quiz.id)}
                    href={`/quizzes/${quiz.documentId || quiz.id}`}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    {quiz.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lesson.lessonType || "TEXT"}</Badge>
          {completed ? <Badge variant="success">Completed</Badge> : null}
        </div>
        <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">
          {lesson.title}
        </h2>

        {embedUrl ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-navy">
            <iframe
              src={embedUrl}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : lesson.videoUrl ? (
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted-foreground">
              This lesson includes an external video resource.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                Open video
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : null}

        <div
          className="prose-lms mt-6 max-w-none"
          dangerouslySetInnerHTML={{
            __html: renderLessonHtml(
              lesson.content || "No content for this lesson yet."
            ),
          }}
        />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            variant="outline"
            disabled={!prev}
            onClick={() => prev && go(prev)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button disabled={pending || completed} onClick={markComplete}>
            {completed ? "Completed" : pending ? "Saving…" : "Mark complete"}
          </Button>
          <Button
            variant="outline"
            disabled={!next}
            onClick={() => next && go(next)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
