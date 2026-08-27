"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

function quizToDraft(quiz: Quiz): {
  title: string;
  description: string;
  questions: DraftQuestion[];
} {
  return {
    title: quiz.title || "",
    description: quiz.description || "",
    questions:
      quiz.questions?.length
        ? quiz.questions.map((q) => ({
            question: q.question || "",
            options:
              q.options?.length
                ? q.options.map((o) => ({
                    text: o.text || "",
                    isCorrect: Boolean(o.isCorrect),
                  }))
                : emptyQuestion().options,
          }))
        : [emptyQuestion()],
  };
}

export function QuizManager({
  courseId,
  quizzes,
  modules = [],
}: {
  courseId: string | number;
  quizzes: Quiz[];
  modules?: Array<{ id: number | string; documentId?: string; title: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState<string>("");
  const [passPercent, setPassPercent] = useState("80");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setModuleId("");
    setPassPercent("80");
    setQuestions([emptyQuestion()]);
  }

  function startEdit(quiz: Quiz) {
    const draft = quizToDraft(quiz);
    setEditing(quiz);
    setTitle(draft.title);
    setDescription(draft.description);
    setQuestions(draft.questions);
    setModuleId(String(quiz.module?.documentId || quiz.module?.id || ""));
    setPassPercent(String(quiz.passPercent ?? 80));
  }

  async function saveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Quiz title is required");
      return;
    }
    setLoading(true);
    const body = {
      title,
      description,
      questions,
      moduleId: moduleId || null,
      passPercent: Number(passPercent) || 80,
    };
    try {
      if (editing) {
        const id = editing.documentId || editing.id;
        await bffFetch(`/api/lms/quizzes/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Quiz updated");
      } else {
        await bffFetch(`/api/lms/courses/${courseId}/quizzes`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Quiz created");
      }
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save quiz");
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
      if (editing && String(editing.documentId || editing.id) === String(deleteId)) {
        resetForm();
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function importFromBank(quizId: string | number) {
    setLoading(true);
    try {
      const bank = await bffFetch<{ data: Array<{ id: string | number; documentId?: string }> }>(
        `/api/lms/courses/${courseId}/question-bank`
      );
      const itemIds = (bank.data || []).map((i) => i.documentId || i.id);
      if (!itemIds.length) {
        toast.error("No question-bank items for this course yet");
        return;
      }
      const res = await bffFetch<{ data: { imported: number } }>(
        `/api/lms/quizzes/${quizId}/import-bank`,
        { method: "POST", body: JSON.stringify({ itemIds }) }
      );
      toast.success(`Imported ${res.data.imported} question(s) from bank`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setLoading(false);
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
                  ({quiz.questions?.length ?? 0} q · pass {quiz.passPercent ?? 80}%
                  {quiz.module?.title ? ` · ${quiz.module.title}` : ""})
                </span>
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void importFromBank(quiz.documentId || quiz.id)}
                >
                  Import bank
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Edit quiz"
                  onClick={() => startEdit(quiz)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete quiz"
                  onClick={() => setDeleteId(quiz.documentId || quiz.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form
          className="space-y-4 rounded-lg border border-dashed border-border p-4"
          onSubmit={saveQuiz}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            {editing ? "Edit quiz" : "Add quiz"}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-module">Module (gate)</Label>
              <select
                id="quiz-module"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
              >
                <option value="">No module link</option>
                {modules.map((m) => (
                  <option key={String(m.documentId || m.id)} value={String(m.documentId || m.id)}>
                    {m.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Students must pass this quiz to unlock the next module.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-pass">Pass percent</Label>
              <Input
                id="quiz-pass"
                type="number"
                min={1}
                max={100}
                value={passPercent}
                onChange={(e) => setPassPercent(e.target.value)}
              />
            </div>
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
              {loading ? "Saving…" : editing ? "Update quiz" : "Create quiz"}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
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
