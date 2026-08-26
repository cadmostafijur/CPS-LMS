"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { bffFetch, ApiError } from "@/lib/api";
import type { Quiz, QuizAttempt } from "@/types";

export function QuizTaker({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const quizId = quiz.documentId || quiz.id;
  const questions = [...(quiz.questions || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  function submit() {
    const payload = questions.map((q) => {
      const qid = String(q.documentId || q.id);
      return {
        questionId: q.documentId || q.id,
        selectedOptionId: answers[qid],
      };
    });

    if (payload.some((a) => !a.selectedOptionId)) {
      toast.error("Please answer every question");
      return;
    }

    startTransition(async () => {
      try {
        await bffFetch<{ data: QuizAttempt }>(`/api/lms/quizzes/${quizId}/submit`, {
          method: "POST",
          body: JSON.stringify({ answers: payload }),
        });
        toast.success("Quiz submitted");
        router.push(`/quizzes/${quizId}/results`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Submit failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{quiz.title}</h1>
        {quiz.description ? (
          <p className="mt-2 text-muted-foreground">{quiz.description}</p>
        ) : null}
      </div>

      {questions.map((question, index) => {
        const qid = String(question.documentId || question.id);
        return (
          <Card key={qid}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(question.options || []).map((option) => {
                const oid = String(option.documentId || option.id);
                const selected = answers[qid] === oid;
                return (
                  <button
                    key={oid}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [qid]: oid }))
                    }
                    className={cn(
                      "flex w-full items-center rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-gold bg-gold/10"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "mr-3 flex h-4 w-4 items-center justify-center rounded-full border",
                        selected ? "border-gold bg-gold" : "border-input"
                      )}
                    />
                    <Label className="cursor-pointer">{option.text}</Label>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/quizzes/${quizId}/results`)}
        >
          View history
        </Button>
        <Button disabled={pending} onClick={submit}>
          {pending ? "Submitting…" : "Submit quiz"}
        </Button>
      </div>
    </div>
  );
}
