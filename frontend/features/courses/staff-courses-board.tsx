"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  BookOpen,
  FilePenLine,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Course, CourseStatus } from "@/types";

export type StaffCourseItem = {
  id: string;
  title: string;
  status: CourseStatus | string;
  lessonCount: number;
  quizCount?: number;
  thumbnailUrl?: string | null;
  shortDescription?: string | null;
  difficulty?: string | null;
  isFree?: boolean;
  instructorName?: string | null;
  categoryName?: string | null;
  editHref: string;
};

export function coursesToStaffItems(
  courses: Course[],
  editBase: string
): StaffCourseItem[] {
  return courses.map((course) => {
    const id = String(course.documentId || course.id);
    return {
      id,
      title: course.title,
      status: course.status,
      lessonCount: course.lessonCount ?? course.lessons?.length ?? 0,
      quizCount: course.quizCount ?? course.quizzes?.length ?? 0,
      thumbnailUrl: course.thumbnailUrl,
      shortDescription: course.shortDescription || course.description,
      difficulty: course.difficulty,
      isFree: course.isFree !== false && !(Number(course.price) > 0),
      instructorName: course.instructor?.name,
      categoryName: course.category?.name,
      editHref: `${editBase}/${id}/edit`,
    };
  });
}

function statusBadge(status: string) {
  const value = status.toUpperCase();
  if (value === "PUBLISHED") return { variant: "success" as const, label: "Published" };
  if (value === "ARCHIVED") return { variant: "outline" as const, label: "Archived" };
  return { variant: "gold" as const, label: "Draft" };
}

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PUBLISHED", label: "Published" },
  { id: "DRAFT", label: "Drafts" },
  { id: "ARCHIVED", label: "Archived" },
] as const;

export function StaffCoursesBoard({
  courses,
  createHref,
  loadError,
}: {
  courses: StaffCourseItem[];
  createHref: string;
  loadError?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const [view, setView] = useState<"grid" | "list">("grid");

  const stats = useMemo(() => {
    const published = courses.filter((c) => c.status === "PUBLISHED").length;
    const drafts = courses.filter((c) => c.status === "DRAFT").length;
    const archived = courses.filter((c) => c.status === "ARCHIVED").length;
    return { total: courses.length, published, drafts, archived };
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (filter !== "ALL" && course.status !== filter) return false;
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        (course.instructorName || "").toLowerCase().includes(q) ||
        (course.categoryName || "").toLowerCase().includes(q)
      );
    });
  }, [courses, filter, query]);

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-2xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total courses", value: stats.total, hint: "In your catalog" },
          { label: "Published", value: stats.published, hint: "Live for students" },
          { label: "Drafts", value: stats.drafts, hint: "Still being built" },
          { label: "Archived", value: stats.archived, hint: "Hidden from catalog" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, instructor, or category"
            className="h-10 border-0 bg-surface pl-9 shadow-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === item.id
                  ? "bg-navy text-white"
                  : "bg-surface text-muted-foreground hover:text-navy"
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="ml-auto flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-1.5",
                view === "grid" ? "bg-orange/15 text-orange" : "text-muted-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5",
                view === "list" ? "bg-orange/15 text-orange" : "text-muted-foreground"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create a draft first. You can add lessons, quizzes, and publish when it’s ready."
          action={
            <Button asChild>
              <Link href={createHref}>
                <Plus className="h-4 w-4" />
                Create course
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try another search or status filter."
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => {
            const badge = statusBadge(String(course.status));
            return (
              <article
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-36 bg-surface">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/15 to-navy/10">
                      <BookOpen className="h-8 w-8 text-orange" />
                    </div>
                  )}
                  <Badge className="absolute left-3 top-3" variant={badge.variant}>
                    {badge.label}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-base font-semibold leading-snug text-navy">
                    {course.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {course.shortDescription || "No description yet."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{course.lessonCount} lessons</span>
                    {course.quizCount != null ? <span>· {course.quizCount} quizzes</span> : null}
                    {course.difficulty ? (
                      <span className="capitalize">· {course.difficulty.toLowerCase()}</span>
                    ) : null}
                    {course.instructorName ? <span>· {course.instructorName}</span> : null}
                  </div>
                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href={course.editHref}>
                      <FilePenLine className="h-4 w-4" />
                      Edit course
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {filtered.map((course, index) => {
            const badge = statusBadge(String(course.status));
            return (
              <div
                key={course.id}
                className={cn(
                  "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center",
                  index > 0 && "border-t border-border"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.lessonCount} lessons
                      {course.instructorName ? ` · ${course.instructorName}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={course.editHref}>Edit</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
