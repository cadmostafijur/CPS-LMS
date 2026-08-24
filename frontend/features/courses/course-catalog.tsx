"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/features/courses/course-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import type { Course } from "@/types";

export function CourseCatalog({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const hay = `${c.title} ${c.shortDescription || ""} ${c.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [courses, debounced]);

  return (
    <div className="space-y-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search courses…"
        className="max-w-md"
      />
      {filtered.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Try a different search term or check back later."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={String(course.documentId || course.id)}
              course={course}
            />
          ))}
        </div>
      )}
    </div>
  );
}
