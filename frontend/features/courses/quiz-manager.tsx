"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { bffFetch, ApiError } from "@/lib/api";
import type { Quiz } from "@/types";

type DraftOption = { text: string; isCorrect: boolean };
type DraftQuestion = { question: string; options: DraftOption[] };

const emptyQuestion = (): DraftQuestion => ({
  question: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

export function QuizManager({
  courseId,
  quizzes,
}: {
  courseId: string | number;
  quizzes: Quiz[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  async function createQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Quiz title is required");
      return;
    }
    setLoading(true);
    try {
      await bffFetch(`/api/lms/courses/${courseId}/quizzes`, {
        method: "POST",
        body: JSON.stringify({ title, description, questions }),
      });
      toast.success("Quiz created");
      setTitle("");
      setDescription("");
      setQuestions([emptyQuestion()]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  }

  async function removeQuiz() {
    if (deleteId == null) return;
    try {
      await bffFetch(`/api/lms/quizzes/${deleteId}`, { method: "DELETE" });
      toast.success("Quiz deleted");
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quizzes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-2">
          {quizzes.map((quiz) => (
            <li
              key={String(quiz.documentId || quiz.id)}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                {quiz.title}
                <span className="ml-2 text-muted-foreground">
                  ({quiz.questions?.length ?? 0} questions)
                </span>
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete quiz"
                onClick={() => setDeleteId(quiz.documentId || quiz.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>

        <form className="space-y-4 rounded-lg border border-dashed border-border p-4" onSubmit={createQuiz}>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add quiz
          </p>
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Title</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-description">Description</Label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="space-y-3 rounded-lg bg-muted/40 p-3">
              <Label>Question {qi + 1}</Label>
              <Input
                value={q.question}
                onChange={(e) => {
                  const next = [...questions];
                  next[qi] = { ...q, question: e.target.value };
                  setQuestions(next);
                }}
                placeholder="Question text"
              />
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Checkbox
                    checked={opt.isCorrect}
                    onCheckedChange={(checked) => {
                      const next = [...questions];
                      next[qi] = {
                        ...q,
                        options: q.options.map((o, idx) => ({
                          ...o,
                          isCorrect: idx === oi ? Boolean(checked) : false,
                        })),
                      };
                      setQuestions(next);
                    }}
                    aria-label="Mark correct"
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...questions];
                      const options = [...q.options];
                      options[oi] = { ...opt, text: e.target.value };
                      next[qi] = { ...q, options };
                      setQuestions(next);
                    }}
                    placeholder={`Option ${oi + 1}`}
                  />
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = [...questions];
                  next[qi] = {
                    ...q,
                    options: [...q.options, { text: "", isCorrect: false }],
                  };
                  setQuestions(next);
                }}
              >
                Add option
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuestions([...questions, emptyQuestion()])}
            >
              Add question
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Creating…" : "Create quiz"}
            </Button>
          </div>
        </form>
      </CardContent>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete quiz?"
        description="All questions and attempts related data may be affected."
        confirmLabel="Delete"
        destructive
        onConfirm={removeQuiz}
      />
    </Card>
  );
}
