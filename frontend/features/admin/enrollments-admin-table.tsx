"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  enrolledAt?: string;
  completedAt?: string | null;
  progress?: { percentage: number };
  student?: User | null;
  course?: { title?: string } | null;
};

export function EnrollmentsAdminTable() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<EnrollmentRow[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
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
  }, [debounced]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Track who is enrolled and how far they have progressed."
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
