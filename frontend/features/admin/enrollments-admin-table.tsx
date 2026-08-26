"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { bffFetch, ApiError } from "@/lib/api";
import type { User } from "@/types";

type EnrollmentRow = {
  id: number | string;
  documentId?: string;
  enrolledAt?: string;
  completedAt?: string | null;
  progress?: { percentage: number };
  student?: User | null;
  course?: { title?: string; id?: number | string; documentId?: string } | null;
};

export function EnrollmentsAdminTable() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<EnrollmentRow[]>([]);
  const [pending, startTransition] = useTransition();
  const [forceOpen, setForceOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [removeTarget, setRemoveTarget] = useState<EnrollmentRow | null>(null);

  function load() {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("search", debounced);
        const res = await bffFetch<{ data: EnrollmentRow[] }>(
          `/api/lms/admin/enrollments?${params.toString()}`
        );
        setItems(res.data || []);
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load enrollments"
        );
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  async function forceEnroll() {
    try {
      await bffFetch("/api/lms/admin/enrollments/force", {
        method: "POST",
        body: JSON.stringify({ studentId, courseId }),
      });
      toast.success("Student enrolled");
      setForceOpen(false);
      setStudentId("");
      setCourseId("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Force enroll failed");
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    try {
      const id = removeTarget.documentId || removeTarget.id;
      await bffFetch(`/api/lms/admin/enrollments/${id}`, { method: "DELETE" });
      toast.success("Enrollment removed");
      setRemoveTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Remove failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Track progress, force-enroll students, or remove access."
        actions={<Button onClick={() => setForceOpen(true)}>Force enroll</Button>}
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search student or course…"
        className="sm:max-w-sm"
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No enrollments yet.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((row) => {
              const pct = row.progress?.percentage ?? 0;
              const done = Boolean(row.completedAt) || pct >= 100;
              return (
                <TableRow key={String(row.id)}>
                  <TableCell>
                    <div className="font-medium">
                      {row.student?.name || row.student?.username || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.student?.email}
                    </div>
                  </TableCell>
                  <TableCell>{row.course?.title || "—"}</TableCell>
                  <TableCell className="min-w-[140px]">
                    <Progress value={pct} />
                    <p className="mt-1 text-xs text-muted-foreground">{pct}%</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={done ? "success" : "secondary"}>
                      {done ? "Completed" : "In progress"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.enrolledAt
                      ? new Date(row.enrolledAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setRemoveTarget(row)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={forceOpen} onOpenChange={setForceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force enroll</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Student ID</Label>
              <Input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="User id or documentId"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Course ID</Label>
              <Input
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="Course id or documentId"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={forceEnroll} disabled={!studentId || !courseId}>
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title="Remove enrollment?"
        description="The student will lose access to this course."
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemove}
      />
    </div>
  );
}
