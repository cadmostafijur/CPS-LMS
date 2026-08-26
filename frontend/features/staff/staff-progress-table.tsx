"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

type ProgressRow = {
  id: number | string;
  documentId?: string;
  enrolledAt?: string;
  completedAt?: string | null;
  progress?: {
    totalLessons: number;
    completedCount: number;
    percentage: number;
  };
  student?: {
    id?: number | string;
    name?: string | null;
    email?: string | null;
  } | null;
  course?: {
    id?: number | string;
    documentId?: string;
    title?: string;
    slug?: string;
  } | null;
};

type CourseOption = {
  id: number | string;
  documentId?: string;
  title: string;
};

export function StaffProgressTable({
  title = "Student progress",
  description = "Progress for students enrolled in courses you can manage.",
  courseEditBase,
}: {
  title?: string;
  description?: string;
  /** Optional base path to link into course edit, e.g. /instructor/courses */
  courseEditBase?: string;
}) {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseId !== "all") params.set("courseId", courseId);
      const qs = params.toString() ? `?${params}` : "";
      const [progressRes, coursesRes] = await Promise.all([
        bffFetch<{ data: ProgressRow[] }>(`/api/lms/staff/progress${qs}`),
        bffFetch<{ data: CourseOption[] }>("/api/lms/staff/courses").catch(() => ({
          data: [] as CourseOption[],
        })),
      ]);
      setRows(progressRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load progress");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const email = r.student?.email?.toLowerCase() || "";
      const name = r.student?.name?.toLowerCase() || "";
      const title = r.course?.title?.toLowerCase() || "";
      return email.includes(q) || name.includes(q) || title.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full space-y-1 sm:max-w-xs">
          <label className="text-xs font-medium text-muted-foreground">Course</label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem
                  key={String(c.documentId || c.id)}
                  value={String(c.documentId || c.id)}
                >
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-1 sm:max-w-sm">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <Input
            placeholder="Student or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No enrollments yet"
            description="When students enroll in your courses, their progress appears here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                {courseEditBase ? <TableHead /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const pct = row.progress?.percentage ?? 0;
                const courseKey = row.course?.documentId || row.course?.id;
                return (
                  <TableRow key={String(row.documentId || row.id)}>
                    <TableCell>
                      <div className="font-medium">{row.student?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.student?.email}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.course?.title || "—"}
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>
                          {row.progress?.completedCount ?? 0}/
                          {row.progress?.totalLessons ?? 0}
                        </span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.enrolledAt ? formatDate(row.enrolledAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.completedAt ? "success" : "secondary"}>
                        {row.completedAt ? "Completed" : "In progress"}
                      </Badge>
                    </TableCell>
                    {courseEditBase && courseKey ? (
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${courseEditBase}/${courseKey}/edit`}>Course</Link>
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
