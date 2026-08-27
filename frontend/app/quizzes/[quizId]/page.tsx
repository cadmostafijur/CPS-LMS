import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizTaker } from "@/features/quizzes/quiz-taker";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { takeQuiz } from "@/services/quizzes.service";

type Props = { params: Promise<{ quizId: string }> };

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  const user = await requireUser(`/quizzes/${quizId}`);
  const token = await getTokenFromCookies();
  const result = await takeQuiz(quizId, token).catch(() => null);
  if (!result?.data) notFound();

  return (
    <div className="min-h-screen bg-surface">
      <Navbar user={user} />
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Quiz
            </p>
            <p className="font-display text-sm font-semibold text-navy">
              {result.data.title}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/quizzes/${quizId}/results`}>Results</Link>
          </Button>
        </div>
      </div>
      <QuizTaker quiz={result.data} />
    </div>
  );
}
