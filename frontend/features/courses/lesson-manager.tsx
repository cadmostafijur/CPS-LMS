"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { bffFetch, ApiError } from "@/lib/api";
import type { Lesson, LessonType } from "@/types";

export function LessonManager({
  courseId,
  lessons,
}: {
  courseId: string | number;
  lessons: Lesson[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lessonType, setLessonType] = useState<LessonType>("TEXT");
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  async function createLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      content: String(form.get("content") || ""),
      videoUrl: String(form.get("videoUrl") || ""),
      lessonType,
      order: Number(form.get("order") || 0),
    };
    if (!payload.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    setLoading(true);
    try {
      await bffFetch(`/api/lms/courses/${courseId}/lessons`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Lesson added");
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add lesson");
    } finally {
      setLoading(false);
    }
  }

  async function removeLesson() {
    if (deleteId == null) return;
    try {
      await bffFetch(`/api/lms/lessons/${deleteId}`, { method: "DELETE" });
      toast.success("Lesson deleted");
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const sorted = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lessons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-2">
          {sorted.map((lesson) => (
            <li
              key={String(lesson.documentId || lesson.id)}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className="mr-2 text-muted-foreground">
                  #{lesson.order ?? 0}
                </span>
                {lesson.title}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete lesson"
                onClick={() => setDeleteId(lesson.documentId || lesson.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>

        <form className="space-y-3 rounded-lg border border-dashed border-border p-4" onSubmit={createLesson}>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add lesson
          </p>
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input id="lesson-title" name="title" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={lessonType}
                onValueChange={(v) => setLessonType(v as LessonType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input id="order" name="order" type="number" defaultValue={sorted.length} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input id="videoUrl" name="videoUrl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" rows={4} />
          </div>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Adding…" : "Add lesson"}
          </Button>
        </form>
      </CardContent>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete lesson?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={removeLesson}
      />
    </Card>
  );
}
