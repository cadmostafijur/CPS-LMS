import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getQuizAttempts } from "@/services/quizzes.service";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ quizId: string }> };

export default async function QuizResultsPage({ params }: Props) {
  const { quizId } = await params;
  await requireUser(`/quizzes/${quizId}/results`);
  const token = await getTokenFromCookies();
  const { data: attempts } = await getQuizAttempts(quizId, token);

  const latest = attempts[0];

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Quiz results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Score history and retake options.
          </p>
        </div>
        <Button asChild>
          <Link href={`/quizzes/${quizId}`}>Retake quiz</Link>
        </Button>
      </div>

      {latest ? (
        <Card className="mb-8 border-gold/40 bg-gold/5">
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
            <Badge variant={latest.percentage >= 70 ? "success" : "warning"}>
              {latest.percentage >= 70 ? "Passed" : "Needs practice"}
            </Badge>
          </CardContent>
        </Card>
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
