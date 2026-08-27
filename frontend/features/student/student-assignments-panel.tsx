"use client";

import { useEffect, useState, useTransition } from "react";
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

export function StudentAssignmentsPanel() {
  const [items, setItems] = useState<AssignmentRow[]>([]);
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fileDrafts, setFileDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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

  async function submit(row: AssignmentRow) {
    const key = String(row.documentId || row.id);
    const content = drafts[key] ?? row.submission?.content ?? "";
    const fileUrl = fileDrafts[key] ?? row.submission?.fileUrl ?? "";
    if (!content.trim() && !fileUrl.trim()) {
      toast.error("Add text or a file URL before submitting");
      return;
    }
    setSavingId(key);
    try {
      await bffFetch(`/api/lms/assignments/${key}/submit`, {
        method: "POST",
        body: JSON.stringify({
          content: content || undefined,
          fileUrl: fileUrl || undefined,
        }),
      });
      toast.success("Submitted");
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
                  <Input
                    placeholder="File URL (Drive, Dropbox, PDF link)…"
                    value={fileDrafts[key] ?? sub?.fileUrl ?? ""}
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
