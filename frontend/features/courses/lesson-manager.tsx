"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { bffFetch, ApiError } from "@/lib/api";
import type { CourseModule, Lesson, LessonType } from "@/types";

export function LessonManager({
  courseId,
  lessons,
  modules = [],
}: {
  courseId: string | number;
  lessons: Lesson[];
  modules?: CourseModule[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [captionsUrl, setCaptionsUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [lessonType, setLessonType] = useState<LessonType>("TEXT");
  const [moduleId, setModuleId] = useState<string>("none");
  const [isPreview, setIsPreview] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  function resetForm(nextOrder = lessons.length) {
    setEditing(null);
    setTitle("");
    setContent("");
    setVideoUrl("");
    setCaptionsUrl("");
    setDocumentUrl("");
    setExternalUrl("");
    setOrder(nextOrder);
    setDurationMinutes(10);
    setLessonType("TEXT");
    setModuleId("none");
    setIsPreview(false);
  }

  function startEdit(lesson: Lesson) {
    setEditing(lesson);
    setTitle(lesson.title || "");
    setContent(lesson.content || "");
    setVideoUrl(lesson.videoUrl || "");
    setCaptionsUrl((lesson as any).captionsUrl || "");
    setDocumentUrl(lesson.documentUrl || "");
    setExternalUrl(lesson.externalUrl || "");
    setOrder(lesson.order ?? 0);
    setDurationMinutes(lesson.durationMinutes ?? 10);
    setLessonType((lesson.lessonType as LessonType) || "TEXT");
    setModuleId(
      lesson.module
        ? String(lesson.module.documentId || lesson.module.id)
        : "none"
    );
    setIsPreview(Boolean(lesson.isPreview));
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    const payload = {
      title,
      content,
      videoUrl,
      captionsUrl,
      documentUrl,
      externalUrl,
      durationMinutes,
      lessonType,
      order,
      isPreview,
      moduleId: moduleId === "none" ? null : moduleId,
    };
    setLoading(true);
    try {
      if (editing) {
        const id = editing.documentId || editing.id;
        await bffFetch(`/api/lms/lessons/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Lesson updated");
      } else {
        await bffFetch(`/api/lms/courses/${courseId}/lessons`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Lesson added");
      }
      resetForm(editing ? lessons.length : lessons.length + 1);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save lesson");
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
      if (editing && String(editing.documentId || editing.id) === String(deleteId)) {
        resetForm();
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const sorted = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedModules = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">#{lesson.order ?? 0}</span>
                  <span className="truncate font-medium">{lesson.title}</span>
                  <Badge variant="secondary">{lesson.lessonType || "TEXT"}</Badge>
                  {lesson.isPreview ? <Badge variant="gold">Preview</Badge> : null}
                </div>
                {lesson.module?.title ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lesson.module.title}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Edit lesson"
                  onClick={() => startEdit(lesson)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete lesson"
                  onClick={() => setDeleteId(lesson.documentId || lesson.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form
          className="space-y-3 rounded-lg border border-dashed border-border p-4"
          onSubmit={saveLesson}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            {editing ? "Edit lesson" : "Add lesson"}
          </p>
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
                  <SelectItem value="PDF">PDF / document</SelectItem>
                  <SelectItem value="URL">External URL</SelectItem>
                  <SelectItem value="AUDIO">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={moduleId} onValueChange={setModuleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No module</SelectItem>
                  {sortedModules.map((mod) => (
                    <SelectItem
                      key={String(mod.documentId || mod.id)}
                      value={String(mod.documentId || mod.id)}
                    >
                      {mod.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input
                id="durationMinutes"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Free preview</Label>
              <Select
                value={isPreview ? "yes" : "no"}
                onValueChange={(v) => setIsPreview(v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(lessonType === "VIDEO" || lessonType === "AUDIO") && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Media URL</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          )}
          {lessonType === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="captionsUrl">Captions / VTT URL</Label>
              <Input
                id="captionsUrl"
                value={captionsUrl}
                onChange={(e) => setCaptionsUrl(e.target.value)}
                placeholder="https://…/captions.vtt"
              />
            </div>
          )}
          {lessonType === "PDF" && (
            <div className="space-y-2">
              <Label htmlFor="documentUrl">Document URL</Label>
              <Input
                id="documentUrl"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://…/file.pdf"
              />
            </div>
          )}
          {lessonType === "URL" && (
            <div className="space-y-2">
              <Label htmlFor="externalUrl">External URL</Label>
              <Input
                id="externalUrl"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading} size="sm">
              {loading ? "Saving…" : editing ? "Update lesson" : "Add lesson"}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" size="sm" onClick={() => resetForm()}>
                Cancel
              </Button>
            ) : null}
          </div>
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
