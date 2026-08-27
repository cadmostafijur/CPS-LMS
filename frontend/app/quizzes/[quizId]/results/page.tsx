import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getQuizAttempts, takeQuiz } from "@/services/quizzes.service";
import { getCourseById, getCourseProgress } from "@/services/courses.service";
import { formatDate } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

type Props = { params: Promise<{ quizId: string }> };

function moduleKey(mod: { id?: string | number; documentId?: string } | null | undefined) {
  if (!mod) return "";
  return String(mod.documentId || mod.id);
}

export default async function QuizResultsPage({ params }: Props) {
  const { quizId } = await params;
  await requireUser(`/quizzes/${quizId}/results`);
  const token = await getTokenFromCookies();

  let attempts: QuizAttempt[] = [];
  let loadError: string | null = null;
  let continueHref: string | null = null;
  let continueLabel = "Continue learning";
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

    const courseId = quiz?.course?.documentId || quiz?.course?.id;
    if (courseId) {
      const [course, progress] = await Promise.all([
        getCourseById(courseId, token).catch(() => null),
        getCourseProgress(courseId, token).catch(() => null),
      ]);

      if (course) {
        const modules = [...(course.modules || [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const lessons = [...(course.lessons || [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const gates = progress?.data?.moduleGates || course.moduleGates || [];
        const quizModuleKey = moduleKey(quiz?.module);

        const currentModIndex = modules.findIndex(
          (m) => moduleKey(m) === quizModuleKey
        );

        if (currentModIndex >= 0 && currentModIndex < modules.length - 1) {
          const nextMod = modules[currentModIndex + 1];
          const gate = gates.find(
            (g) =>
              String(g.moduleDocumentId || g.moduleId) === moduleKey(nextMod)
          );
          const unlocked = gate ? gate.unlocked : true;
          if (unlocked) {
            const firstLesson = lessons.find(
              (l) => moduleKey(l.module) === moduleKey(nextMod)
            );
            if (firstLesson) {
              continueHref = `/learn/${course.documentId || course.id}/${firstLesson.documentId || firstLesson.id}`;
              continueLabel = `Go to next module: ${nextMod.title}`;
            }
          }
        } else if (currentModIndex === modules.length - 1) {
          continueHref = `/student/my-courses`;
          continueLabel = "Back to my courses";
        }

        if (!continueHref) {
          const first = lessons[0];
          if (first) {
            continueHref = `/learn/${course.documentId || course.id}/${first.documentId || first.id}`;
            continueLabel = "Back to course player";
          } else if (course.slug) {
            continueHref = `/courses/${course.slug}`;
            continueLabel = "Back to course";
          }
        }
      }
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
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Quiz results</h1>
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
                ? `Passed (${passPercent}%+) — next module unlocked`
                : `Need ${passPercent}% to unlock next module`}
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      {passed && continueHref ? (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-success/30 bg-success/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-navy">
              Next module is unlocked
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump straight into the next lessons and videos.
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
        <div className="mb-8 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted-foreground">
          Score at least <strong>{passPercent}%</strong> to unlock the next
          module.{" "}
          <Link href={`/quizzes/${quizId}`} className="font-medium text-orange underline">
            Retake quiz
          </Link>
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
  );
}
