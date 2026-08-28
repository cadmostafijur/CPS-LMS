"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bffFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type AssignmentRow = {
  id: number | string;
  documentId?: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  maxMarks?: number;
  course?: { title?: string } | null;
  submission?: {
    id: number | string;
    content?: string | null;
    fileUrl?: string | null;
    score?: number | null;
    feedback?: string | null;
    status?: string;
    submittedAt?: string;
  } | null;
};

function validateFile(file: File): string | null {
  const extOk = /\.(pdf|png|jpe?g|webp|gif|txt|md|zip|doc|docx)$/i.test(file.name);
  const typeOk = !file.type || ACCEPTED_TYPES.includes(file.type);
  if (!extOk && !typeOk) {
    return "Choose a PDF or image (PNG, JPG, WebP, GIF).";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "File must be under 15 MB.";
  }
  return null;
}

export function StudentAssignmentsPanel() {
  const [items, setItems] = useState<AssignmentRow[]>([]);
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fileDrafts, setFileDrafts] = useState<Record<string, string>>({});
  const [fileInputs, setFileInputs] = useState<Record<string, File | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: AssignmentRow[] }>("/api/lms/assignments");
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load assignments");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  function pickFile(key: string, file: File | null) {
    if (!file) {
      setFileInputs((d) => ({ ...d, [key]: null }));
      return;
    }
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      const input = fileRefs.current[key];
      if (input) input.value = "";
      return;
    }
    setFileInputs((d) => ({ ...d, [key]: file }));
    setFileDrafts((d) => ({ ...d, [key]: "" }));
  }

  async function submit(row: AssignmentRow) {
    const key = String(row.documentId || row.id);
    const content = drafts[key] ?? row.submission?.content ?? "";
    const fileUrl = fileDrafts[key] ?? row.submission?.fileUrl ?? "";
    const file = fileInputs[key];
    if (!content.trim() && !fileUrl.trim() && !file) {
      toast.error("Add text or upload a file before submitting");
      return;
    }

    setSavingId(key);
    try {
      const form = new FormData();
      if (content.trim()) form.append("content", content.trim());
      if (!file && fileUrl.trim()) form.append("fileUrl", fileUrl.trim());
      if (file) form.append("file", file);

      await bffFetch(`/api/lms/assignments/${key}/submit`, {
        method: "POST",
        body: form,
      });
      toast.success("Submitted");
      setFileInputs((f) => ({ ...f, [key]: null }));
      const input = fileRefs.current[key];
      if (input) input.value = "";
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Submit failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Homework for courses you are enrolled in."
        actions={
          <Button variant="outline" onClick={() => load()} disabled={pending}>
            Refresh
          </Button>
        }
      />
      {items.length === 0 && !pending ? (
        <EmptyState
          title="No assignments yet"
          description="When instructors publish homework for your courses, it appears here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((row) => {
            const key = String(row.documentId || row.id);
            const sub = row.submission;
            const selectedFile = fileInputs[key];
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-base">{row.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.course?.title || "Course"}
                      {row.dueDate ? ` · Due ${formatDate(row.dueDate)}` : ""}
                      {row.maxMarks != null ? ` · ${row.maxMarks} marks` : ""}
                    </p>
                  </div>
                  <Badge variant={sub ? "success" : "secondary"}>
                    {sub?.status || "Not submitted"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {row.description ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {row.description}
                    </p>
                  ) : null}
                  {sub?.score != null ? (
                    <p className="text-sm font-medium text-navy">
                      Score: {sub.score}
                      {sub.feedback ? ` — ${sub.feedback}` : ""}
                    </p>
                  ) : null}
                  <Textarea
                    rows={4}
                    placeholder="Your submission…"
                    value={drafts[key] ?? sub?.content ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [key]: e.target.value }))
                    }
                  />

                  <div className="space-y-2">
                    <input
                      ref={(el) => {
                        fileRefs.current[key] = el;
                      }}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.zip,.doc,.docx,application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => pickFile(key, e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => fileRefs.current[key]?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                        Attach PDF or image
                      </Button>
                      {selectedFile ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1 text-xs font-medium text-navy">
                          {selectedFile.name}
                          <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-orange/20"
                            aria-label="Remove file"
                            onClick={() => {
                              setFileInputs((d) => ({ ...d, [key]: null }));
                              const input = fileRefs.current[key];
                              if (input) input.value = "";
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF or images up to 15 MB. Or paste a file URL below.
                    </p>
                  </div>

                  <Input
                    placeholder="Or paste a file URL…"
                    value={fileDrafts[key] ?? sub?.fileUrl ?? ""}
                    disabled={Boolean(selectedFile)}
                    onChange={(e) =>
                      setFileDrafts((d) => ({ ...d, [key]: e.target.value }))
                    }
                  />
                  {sub?.fileUrl ? (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-orange underline"
                    >
                      Current file
                    </a>
                  ) : null}
                  <Button
                    disabled={savingId === key}
                    onClick={() => void submit(row)}
                  >
                    {savingId === key
                      ? "Submitting…"
                      : sub
                        ? "Update submission"
                        : "Submit"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
