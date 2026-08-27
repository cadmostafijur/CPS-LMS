"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [pending, startTransition] = useTransition();
  const submittedRef = useRef(false);
  const quizId = quiz.documentId || quiz.id;
  const questions = [...(quiz.questions || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const limitMin = Number(quiz.timeLimitMinutes || 0);
  const [secondsLeft, setSecondsLeft] = useState(
    limitMin > 0 ? limitMin * 60 : 0
  );

  function submit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const current = answersRef.current;
    const payload = questions.map((q) => {
      const qid = String(q.documentId || q.id);
      return {
        questionId: q.documentId || q.id,
        selectedOptionId: current[qid],
      };
    });

    if (!auto && payload.some((a) => !a.selectedOptionId)) {
      submittedRef.current = false;
      toast.error("Please answer every question");
      return;
    }

    startTransition(async () => {
      try {
        const result = await bffFetch<{
          data: QuizAttempt & { passed?: boolean; courseId?: string | number };
        }>(`/api/lms/quizzes/${quizId}/submit`, {
          method: "POST",
          body: JSON.stringify({
            answers: payload.filter((a) => a.selectedOptionId),
          }),
        });
        if (auto) toast.info("Time is up — quiz auto-submitted");
        else if (result.data?.passed) {
          toast.success("Passed! Next module unlocked — open results to continue");
        } else {
          toast.success("Submitted — check results for your score");
        }
        router.push(`/quizzes/${quizId}/results`);
        router.refresh();
      } catch (err) {
        submittedRef.current = false;
        toast.error(err instanceof ApiError ? err.message : "Submit failed");
      }
    });
  }

  useEffect(() => {
    if (limitMin <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [limitMin]);

  useEffect(() => {
    if (limitMin > 0 && secondsLeft === 0) {
      submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, limitMin]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{quiz.title}</h1>
          {quiz.description ? (
            <p className="mt-2 text-muted-foreground">{quiz.description}</p>
          ) : null}
        </div>
        {limitMin > 0 ? (
          <div className="rounded-xl border border-orange/30 bg-orange/5 px-4 py-2 text-sm font-semibold text-navy">
            Time left: {mm}:{ss}
          </div>
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
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-orange bg-orange/10"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 rounded-full border",
                        selected ? "border-orange bg-orange" : "border-muted-foreground"
                      )}
                    />
                    <Label className="cursor-pointer font-normal">{option.text}</Label>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Button disabled={pending} onClick={() => submit(false)} className="w-full sm:w-auto">
        {pending ? "Submitting…" : "Submit quiz"}
      </Button>
    </div>
  );
}
