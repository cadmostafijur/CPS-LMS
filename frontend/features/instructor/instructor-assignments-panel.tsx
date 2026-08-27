"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bffFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type CourseOpt = { id: number | string; documentId?: string; title: string };
type AssignmentRow = {
  id: number | string;
  documentId?: string;
  title: string;
  status?: string;
  dueDate?: string | null;
  maxMarks?: number;
  course?: { title?: string } | null;
};
type SubmissionRow = {
  id: number | string;
  documentId?: string;
  content?: string | null;
  score?: number | null;
  feedback?: string | null;
  status?: string;
  submittedAt?: string;
  student?: { name?: string | null; email?: string | null } | null;
};

export function InstructorAssignmentsPanel() {
  const [items, setItems] = useState<AssignmentRow[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    maxMarks: "100",
    status: "PUBLISHED",
  });
  const [gradeFor, setGradeFor] = useState<AssignmentRow | null>(null);
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  function load() {
    startTransition(async () => {
      try {
        const [a, c] = await Promise.all([
          bffFetch<{ data: AssignmentRow[] }>("/api/lms/staff/assignments"),
          bffFetch<{ data: CourseOpt[] }>("/api/lms/staff/courses"),
        ]);
        setItems(a.data || []);
        setCourses(c.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function createAssignment() {
    if (!form.title.trim() || !form.course) {
      toast.error("Title and course are required");
      return;
    }
    try {
      await bffFetch("/api/lms/staff/assignments", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description || null,
          course: form.course,
          maxMarks: Number(form.maxMarks) || 100,
          status: form.status,
        }),
      });
      toast.success("Assignment created");
      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        course: "",
        maxMarks: "100",
        status: "PUBLISHED",
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function openSubmissions(row: AssignmentRow) {
    setGradeFor(row);
    try {
      const id = row.documentId || row.id;
      const res = await bffFetch<{ data: SubmissionRow[] }>(
        `/api/lms/staff/assignments/${id}/submissions`
      );
      setSubs(res.data || []);
      const s: Record<string, string> = {};
      const f: Record<string, string> = {};
      for (const sub of res.data || []) {
        const k = String(sub.documentId || sub.id);
        s[k] = sub.score != null ? String(sub.score) : "";
        f[k] = sub.feedback || "";
      }
      setScores(s);
      setFeedbacks(f);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load submissions");
    }
  }

  async function grade(sub: SubmissionRow) {
    const key = String(sub.documentId || sub.id);
    try {
      await bffFetch(`/api/lms/staff/submissions/${key}/grade`, {
        method: "PATCH",
        body: JSON.stringify({
          score: scores[key] === "" ? null : Number(scores[key]),
          feedback: feedbacks[key] || null,
          status: "GRADED",
        }),
      });
      toast.success("Graded");
      if (gradeFor) void openSubmissions(gradeFor);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Grade failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Create homework for your courses and grade student submissions."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => load()} disabled={pending}>
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>New assignment</Button>
          </div>
        }
      />

      {items.length === 0 && !pending ? (
        <EmptyState
          title="No assignments"
          description="Create an assignment linked to one of your courses."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={String(row.documentId || row.id)}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.course?.title || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.dueDate ? formatDate(row.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void openSubmissions(row)}>
                      Submissions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select
                value={form.course}
                onValueChange={(v) => setForm((f) => ({ ...f, course: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={String(c.documentId || c.id)} value={String(c.documentId || c.id)}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Max marks</Label>
                <Input
                  type="number"
                  value={form.maxMarks}
                  onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createAssignment()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(gradeFor)} onOpenChange={(o) => !o && setGradeFor(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submissions — {gradeFor?.title}</DialogTitle>
          </DialogHeader>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {subs.map((sub) => {
                const key = String(sub.documentId || sub.id);
                return (
                  <div key={key} className="rounded-xl border border-border p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {sub.student?.name || sub.student?.email || "Student"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sub.submittedAt ? formatDate(sub.submittedAt) : ""} · {sub.status}
                        </p>
                      </div>
                      <Badge variant="secondary">{sub.status}</Badge>
                    </div>
                    <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {sub.content || "—"}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[100px_1fr_auto]">
                      <Input
                        type="number"
                        placeholder="Score"
                        value={scores[key] ?? ""}
                        onChange={(e) =>
                          setScores((s) => ({ ...s, [key]: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Feedback"
                        value={feedbacks[key] ?? ""}
                        onChange={(e) =>
                          setFeedbacks((s) => ({ ...s, [key]: e.target.value }))
                        }
                      />
                      <Button size="sm" onClick={() => void grade(sub)}>
                        Grade
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
