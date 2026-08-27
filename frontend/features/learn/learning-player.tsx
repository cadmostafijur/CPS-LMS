"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  List,
  Lock,
  PlayCircle,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { bffFetch, ApiError } from "@/lib/api";
import type { Course, Lesson, ModuleGate } from "@/types";

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

function moduleKey(mod: { id?: string | number; documentId?: string } | null | undefined) {
  if (!mod) return "";
  return String(mod.documentId || mod.id);
}

export function LearningPlayer({
  course,
  lesson,
  completedLessonIds,
  progressPercent,
  moduleGates: gatesProp,
}: {
  course: Course;
  lesson: Lesson;
  completedLessonIds: Array<string | number>;
  progressPercent: number;
  moduleGates?: ModuleGate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const lessons = [...(course.lessons || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const quizzes = course.quizzes || [];
  const courseId = course.documentId || course.id;
  const currentId = lesson.documentId || lesson.id;
  const modules = [...(course.modules || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const gates = useMemo(() => {
    const fromProp = gatesProp?.length ? gatesProp : course.moduleGates || [];
    const map = new Map<string, ModuleGate>();
    for (const g of fromProp) {
      map.set(String(g.moduleDocumentId || g.moduleId), g);
    }
    // Fallback: first module unlocked if API didn't send gates yet
    if (map.size === 0 && modules.length > 0) {
      modules.forEach((m, i) => {
        map.set(moduleKey(m), {
          moduleId: m.id,
          moduleDocumentId: m.documentId,
          moduleTitle: m.title,
          order: m.order ?? i,
          unlocked: i === 0,
          passPercent: 80,
          quizPassed: false,
        });
      });
    }
    return map;
  }, [gatesProp, course.moduleGates, modules]);

  function isModuleUnlocked(mod: { id?: string | number; documentId?: string }) {
    const g = gates.get(moduleKey(mod));
    return g ? Boolean(g.unlocked) : true;
  }

  function quizForModule(mod: { id?: string | number; documentId?: string }) {
    const g = gates.get(moduleKey(mod));
    if (g?.quizDocumentId || g?.quizId) {
      return {
        id: g.quizDocumentId || g.quizId,
        title: g.quizTitle || "Module quiz",
        passPercent: g.passPercent ?? 80,
        passed: Boolean(g.quizPassed),
        bestScore: g.bestScore,
      };
    }
    const linked = quizzes.find(
      (q) =>
        String(q.module?.documentId || q.module?.id) === moduleKey(mod)
    );
    if (linked) {
      return {
        id: linked.documentId || linked.id,
        title: linked.title,
        passPercent: linked.passPercent ?? 80,
        passed: false,
        bestScore: null as number | null,
      };
    }
    return null;
  }

  const currentModule = lesson.module
    ? modules.find(
        (m) =>
          moduleKey(m) === moduleKey(lesson.module) ||
          String(m.id) === String(lesson.module?.id)
      ) || lesson.module
    : null;
  const currentUnlocked = currentModule
    ? isModuleUnlocked(currentModule)
    : true;

  const unlockedLessons = lessons.filter((l) => {
    if (!l.module) return true;
    const mod = modules.find((m) => moduleKey(m) === moduleKey(l.module));
    return mod ? isModuleUnlocked(mod) : true;
  });

  const index = unlockedLessons.findIndex(
    (l) => String(l.documentId || l.id) === String(currentId)
  );
  const prev = index > 0 ? unlockedLessons[index - 1] : null;
  const next =
    index >= 0 && index < unlockedLessons.length - 1
      ? unlockedLessons[index + 1]
      : null;

  const completed = completedLessonIds.some(
    (id) => String(id) === String(currentId)
  );
  const embedUrl = lesson.videoUrl ? toYouTubeEmbed(lesson.videoUrl) : null;
  const contentLocked =
    !lesson.content &&
    !lesson.videoUrl &&
    !lesson.documentUrl &&
    !lesson.externalUrl &&
    !course.enrolled;

  const moduleLessons = currentModule
    ? lessons.filter((l) => moduleKey(l.module) === moduleKey(currentModule))
    : [];
  const lastInModule =
    currentModule &&
    moduleLessons.length > 0 &&
    String(moduleLessons[moduleLessons.length - 1].documentId || moduleLessons[moduleLessons.length - 1].id) ===
      String(currentId);
  const moduleQuiz = currentModule ? quizForModule(currentModule) : null;

  function go(target: Lesson) {
    if (target.module && !isModuleUnlocked(target.module)) {
      toast.error("Pass the previous module quiz with 80% to unlock this lesson");
      return;
    }
    setCurriculumOpen(false);
    router.push(`/learn/${courseId}/${target.documentId || target.id}`);
  }

  function markComplete() {
    if (!course.enrolled) {
      toast.error("Enroll in this course to track progress");
      return;
    }
    if (!currentUnlocked) {
      toast.error("This module is locked until you pass the previous quiz (80%)");
      return;
    }
    startTransition(async () => {
      try {
        const result = await bffFetch<{
          data?: {
            certificate?: { documentId?: string; id?: string | number } | null;
          };
        }>(`/api/lms/lessons/${currentId}/complete`, {
          method: "POST",
        });
        const cert = result?.data?.certificate;
        if (cert) {
          toast.success("Course complete — certificate issued!");
          router.push(`/certificates/${cert.documentId || cert.id}`);
        } else if (lastInModule && moduleQuiz && !moduleQuiz.passed) {
          toast.success("Lesson complete — take the module quiz (need 80%)");
        } else {
          toast.success("Lesson marked complete");
        }
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
      <aside className="w-full border-b border-border bg-card md:w-72 md:shrink-0 md:border-b-0 md:border-r">
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
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Pass each module quiz with <strong>80%</strong> to unlock the next
              module.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-between md:hidden"
            onClick={() => setCurriculumOpen((v) => !v)}
            aria-expanded={curriculumOpen}
          >
            <span className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {curriculumOpen ? "Hide curriculum" : "Show curriculum"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                curriculumOpen && "rotate-180"
              )}
            />
          </Button>

          <nav
            className={cn(
              "max-h-[55vh] space-y-3 overflow-y-auto md:max-h-[calc(100vh-12rem)]",
              curriculumOpen ? "block" : "hidden md:block"
            )}
          >
            {modules.length > 0
              ? modules.map((mod) => {
                  const unlocked = isModuleUnlocked(mod);
                  const gate = gates.get(moduleKey(mod));
                  const modLessons = lessons.filter(
                    (l) => moduleKey(l.module) === moduleKey(mod)
                  );
                  const qz = quizForModule(mod);
                  return (
                    <div key={moduleKey(mod)}>
                      <p className="mb-1 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {!unlocked ? <Lock className="h-3 w-3" /> : null}
                        {mod.title}
                        {gate?.quizPassed ? (
                          <span className="normal-case text-success">· passed</span>
                        ) : null}
                      </p>
                      <div className="space-y-1">
                        {modLessons.map((item) => {
                          const id = item.documentId || item.id;
                          const active = String(id) === String(currentId);
                          const done = completedLessonIds.some(
                            (x) => String(x) === String(id)
                          );
                          if (!unlocked) {
                            return (
                              <div
                                key={String(id)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
                              >
                                <Lock className="h-3.5 w-3.5 shrink-0" />
                                <span className="line-clamp-2">{item.title}</span>
                              </div>
                            );
                          }
                          return (
                            <Link
                              key={String(id)}
                              href={`/learn/${courseId}/${id}`}
                              onClick={() => setCurriculumOpen(false)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                active
                                  ? "bg-orange/10 text-orange"
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                              ) : item.videoUrl ? (
                                <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <span className="w-4 text-center text-xs text-muted-foreground">
                                  ·
                                </span>
                              )}
                              <span className="line-clamp-2">{item.title}</span>
                            </Link>
                          );
                        })}
                        {qz ? (
                          unlocked ? (
                            <Link
                              href={`/quizzes/${qz.id}`}
                              onClick={() => setCurriculumOpen(false)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                                qz.passed
                                  ? "text-success hover:bg-muted"
                                  : "bg-navy/5 text-navy hover:bg-orange/10"
                              )}
                            >
                              {qz.passed ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                              ) : (
                                <span className="text-xs">Quiz</span>
                              )}
                              <span className="line-clamp-2">
                                {qz.title}
                                {qz.bestScore != null
                                  ? ` (${qz.bestScore}%)`
                                  : ` · need ${qz.passPercent}%`}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/70">
                              <Lock className="h-3.5 w-3.5" />
                              Module quiz locked
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })
              : lessons.map((item, i) => {
                  const id = item.documentId || item.id;
                  const active = String(id) === String(currentId);
                  const done = completedLessonIds.some(
                    (x) => String(x) === String(id)
                  );
                  return (
                    <Link
                      key={String(id)}
                      href={`/learn/${courseId}/${id}`}
                      onClick={() => setCurriculumOpen(false)}
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
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        {!currentUnlocked ? (
          <div className="rounded-xl border border-dashed border-orange/40 bg-orange/5 p-8 text-center">
            <Lock className="mx-auto mb-3 h-8 w-8 text-orange" />
            <h2 className="font-display text-xl font-bold text-navy">
              Module locked
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Score at least <strong>80%</strong> on the previous module quiz to
              unlock these lessons and videos.
            </p>
            {(() => {
              const idx = modules.findIndex(
                (m) => moduleKey(m) === moduleKey(currentModule)
              );
              const prevMod = idx > 0 ? modules[idx - 1] : null;
              const prevQz = prevMod ? quizForModule(prevMod) : null;
              return prevQz ? (
                <Button asChild className="mt-6">
                  <Link href={`/quizzes/${prevQz.id}`}>Take previous module quiz</Link>
                </Button>
              ) : null;
            })()}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {lesson.videoUrl ? "VIDEO" : lesson.lessonType || "TEXT"}
              </Badge>
              {lesson.isPreview ? <Badge variant="gold">Preview</Badge> : null}
              {completed ? <Badge variant="success">Completed</Badge> : null}
            </div>
            <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">
              {lesson.title}
            </h2>

            {contentLocked ? (
              <div className="mt-6 rounded-xl border border-border bg-surface p-6">
                <p className="text-sm text-muted-foreground">
                  Enroll to unlock this lesson.
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/courses/${course.slug}`}>View course</Link>
                </Button>
              </div>
            ) : (
              <>
                {embedUrl ? (
                  <div className="mt-6 w-full max-w-3xl">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-navy shadow-sm">
                      <iframe
                        src={embedUrl}
                        title={lesson.title}
                        className="absolute inset-0 h-full w-full border-0"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : lesson.lessonType === "AUDIO" && lesson.videoUrl ? (
                  <audio className="mt-6 w-full max-w-3xl" controls src={lesson.videoUrl} />
                ) : lesson.videoUrl ? (
                  <div className="mt-6 max-w-3xl rounded-xl border border-border bg-surface p-4">
                    <Button asChild variant="outline">
                      <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                        Open media
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 max-w-3xl rounded-xl border border-dashed border-border bg-surface/80 px-4 py-3 text-sm text-muted-foreground">
                    No video attached yet for this topic. Text lesson is below.
                  </div>
                )}

                {lesson.documentUrl ? (
                  <div className="mt-6 w-full max-w-3xl overflow-hidden rounded-xl border border-border">
                    <iframe
                      title={lesson.title}
                      src={lesson.documentUrl}
                      className="h-[min(70vh,32rem)] w-full bg-white"
                    />
                  </div>
                ) : null}

                {lesson.externalUrl ? (
                  <div className="mt-6 rounded-xl border border-border bg-surface p-4">
                    <Button asChild>
                      <a href={lesson.externalUrl} target="_blank" rel="noreferrer">
                        Open resource
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
              </>
            )}

            {lastInModule && moduleQuiz ? (
              <div className="mt-8 rounded-xl border border-orange/30 bg-orange/5 p-5">
                <p className="font-display text-lg font-semibold text-navy">
                  Module checkpoint
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finish this module by scoring at least{" "}
                  <strong>{moduleQuiz.passPercent}%</strong> on the quiz. Passing
                  unlocks the next module.
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/quizzes/${moduleQuiz.id}`}>
                    {moduleQuiz.passed
                      ? "Retake module quiz"
                      : "Take module quiz (80% to pass)"}
                  </Link>
                </Button>
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <Button
                variant="outline"
                disabled={!prev}
                onClick={() => prev && go(prev)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                disabled={pending || completed || !course.enrolled}
                onClick={markComplete}
              >
                {completed
                  ? "Completed"
                  : pending
                    ? "Saving…"
                    : course.enrolled
                      ? "Mark complete"
                      : "Enroll to complete"}
              </Button>
              {next ? (
                <Button variant="outline" onClick={() => go(next)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : lastInModule && moduleQuiz && !moduleQuiz.passed ? (
                <Button asChild>
                  <Link href={`/quizzes/${moduleQuiz.id}`}>
                    Quiz to unlock next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
