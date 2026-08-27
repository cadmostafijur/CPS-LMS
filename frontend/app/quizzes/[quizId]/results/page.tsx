import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Navbar } from "@/components/layout/navbar";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getQuizAttempts, takeQuiz } from "@/services/quizzes.service";
import { getCourseById, getCourseProgress } from "@/services/courses.service";
import { formatDate } from "@/lib/utils";
import type { Course, Lesson, ModuleGate, Quiz, QuizAttempt } from "@/types";

type Props = { params: Promise<{ quizId: string }> };

function moduleKey(mod: { id?: string | number; documentId?: string } | null | undefined) {
  if (!mod) return "";
  return String(mod.documentId || mod.id);
}

function lessonBelongsToModule(lesson: Lesson, modKey: string, modulesLen: number, modIndex: number) {
  const lk = moduleKey(lesson.module);
  if (lk && modKey) return lk === modKey;
  // Fallback when lesson.module is missing: first half → module 0, rest → later
  if (!lk && modulesLen > 0) {
    const order = lesson.order ?? 0;
    if (modIndex <= 0) return order < 2;
    return order >= 2;
  }
  return false;
}

function resolveContinueTarget(
  course: Course,
  quiz: Quiz | undefined,
  gates: ModuleGate[],
  passed: boolean
): { href: string; label: string; hasNextModule: boolean } | null {
  const courseKey = course.documentId || course.id;
  const modules = [...(course.modules || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const lessons = [...(course.lessons || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  if (!lessons.length) {
    return {
      href: "/student/my-courses",
      label: "Back to my courses",
      hasNextModule: false,
    };
  }

  const quizId = String(quiz?.documentId || quiz?.id || "");
  let modIndex = modules.findIndex((m) => moduleKey(m) === moduleKey(quiz?.module));

  if (modIndex < 0 && quizId) {
    const gate = gates.find(
      (g) =>
        String(g.quizDocumentId || g.quizId || "") === quizId
    );
    if (gate) {
      modIndex = modules.findIndex(
        (m) =>
          String(m.documentId || m.id) ===
          String(gate.moduleDocumentId || gate.moduleId)
      );
    }
  }

  // Still unknown → treat as first module quiz when passed (unlocks second)
  if (modIndex < 0 && modules.length > 1 && passed) {
    modIndex = 0;
  }

  const learnUrl = (lesson: Lesson) =>
    `/learn/${courseKey}/${lesson.documentId || lesson.id}`;

  if (modIndex >= 0 && modIndex < modules.length - 1) {
    const nextMod = modules[modIndex + 1];
    const nextKey = moduleKey(nextMod);
    const gate = gates.find(
      (g) => String(g.moduleDocumentId || g.moduleId) === nextKey
    );
    // After a pass, force-allow next module even if gate cache is stale
    const unlocked = passed || !gate || gate.unlocked;
    if (unlocked) {
      const firstLesson =
        lessons.find((l) =>
          lessonBelongsToModule(l, nextKey, modules.length, modIndex + 1)
        ) || lessons.find((l) => (l.order ?? 0) >= 2) || lessons[Math.min(2, lessons.length - 1)];
      if (firstLesson) {
        return {
          href: learnUrl(firstLesson),
          label: `Go to next module: ${nextMod.title}`,
          hasNextModule: true,
        };
      }
    }
  }

  // Passed last module quiz, or only one module — still open course player
  if (modIndex === modules.length - 1 && modules.length > 0) {
    const last = modules[modIndex];
    const firstInLast =
      lessons.find((l) =>
        lessonBelongsToModule(l, moduleKey(last), modules.length, modIndex)
      ) || lessons[0];
    return {
      href: learnUrl(firstInLast),
      label: "Continue in course player",
      hasNextModule: false,
    };
  }

  // Generic fallback: open first unlocked module's first lesson (prefer module index > 0 after pass)
  if (passed && modules.length > 1) {
    const second = modules[1];
    const lesson =
      lessons.find((l) =>
        lessonBelongsToModule(l, moduleKey(second), modules.length, 1)
      ) || lessons[Math.min(2, lessons.length - 1)];
    return {
      href: learnUrl(lesson),
      label: `Go to next module: ${second.title}`,
      hasNextModule: true,
    };
  }

  return {
    href: learnUrl(lessons[0]),
    label: "Continue learning",
    hasNextModule: false,
  };
}

export default async function QuizResultsPage({ params }: Props) {
  const { quizId } = await params;
  const user = await requireUser(`/quizzes/${quizId}/results`);
  const token = await getTokenFromCookies();

  let attempts: QuizAttempt[] = [];
  let loadError: string | null = null;
  let continueHref: string | null = null;
  let continueLabel = "Continue learning";
  let hasNextModule = false;
  let courseTitle: string | null = null;
  let passPercent = 80;

  try {
    const [attemptsRes, quizRes] = await Promise.all([
      getQuizAttempts(quizId, token),
      takeQuiz(quizId, token).catch(() => null),
    ]);
    attempts = attemptsRes.data || [];
    const quiz = quizRes?.data;
    passPercent = Number(quiz?.passPercent ?? 80);
    courseTitle = quiz?.course?.title || null;

    const latestEarly = attempts[0];
    const bestEarly = attempts.reduce(
      (max, a) => Math.max(max, a.percentage ?? 0),
      latestEarly?.percentage ?? 0
    );
    const passedEarly = bestEarly >= passPercent;

    const courseId = quiz?.course?.documentId || quiz?.course?.id;
    if (courseId) {
      const [course, progress] = await Promise.all([
        getCourseById(courseId, token).catch(() => null),
        getCourseProgress(courseId, token).catch(() => null),
      ]);

      if (course) {
        const gates = progress?.data?.moduleGates || course.moduleGates || [];
        const target = resolveContinueTarget(course, quiz, gates, passedEarly);
        if (target) {
          continueHref = target.href;
          continueLabel = target.label;
          hasNextModule = target.hasNextModule;
        }
      }
    }

    // Last resort if quiz take failed but we have attempts only
    if (!continueHref) {
      continueHref = "/student/my-courses";
      continueLabel = "Back to my courses";
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load results";
  }

  const latest = attempts[0];
  const best = attempts.reduce(
    (max, a) => Math.max(max, a.percentage ?? 0),
    latest?.percentage ?? 0
  );
  const passed = best >= passPercent;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Quiz results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {courseTitle
              ? `${courseTitle} · need ${passPercent}% to unlock the next module`
              : `Score history · pass at ${passPercent}%`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/quizzes/${quizId}`}>Retake quiz</Link>
        </Button>
      </div>

      {loadError ? (
        <p className="mb-6 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {latest ? (
        <Card className="mb-6 border-gold/40 bg-gold/5">
          <CardHeader>
            <CardTitle>Latest attempt</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <p className="font-display text-4xl font-bold">
              {latest.percentage}%
            </p>
            <div className="text-sm text-muted-foreground">
              <p>
                Score: {latest.score}/{latest.totalQuestions}
              </p>
              <p>{formatDate(latest.submittedAt)}</p>
            </div>
            <Badge variant={passed ? "success" : "warning"}>
              {passed
                ? hasNextModule
                  ? `Passed (${passPercent}%+) — next module unlocked`
                  : `Passed (${passPercent}%+)`
                : `Need ${passPercent}% to unlock next module`}
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      {passed && continueHref ? (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-success/30 bg-success/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-navy">
              {hasNextModule ? "Next module is unlocked" : "Great work"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasNextModule
                ? "Open the next module lectures and videos now."
                : "Continue in the course player to keep learning."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href={continueHref}>
                {continueLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/my-courses">
                <BookOpen className="h-4 w-4" />
                My courses
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!passed && latest ? (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-orange/30 bg-orange/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-navy">
              Not quite there yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Score at least <strong>{passPercent}%</strong> to unlock the next
              module. Best so far: {best}%.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/quizzes/${quizId}`}>Retake quiz</Link>
          </Button>
        </div>
      ) : null}

      {attempts.length === 0 ? (
        <EmptyState
          title="No attempts yet"
          description="Take the quiz to see your score history."
          action={
            <Button asChild>
              <Link href={`/quizzes/${quizId}`}>Take quiz</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Attempt history</h2>
          {attempts.map((attempt) => (
            <Card key={String(attempt.documentId || attempt.id)}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {attempt.score}/{attempt.totalQuestions} correct
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(attempt.submittedAt)}
                  </p>
                </div>
                <p className="font-display text-xl font-bold">
                  {attempt.percentage}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
