"use client";

import { useEffect, useMemo, useState } from "react";
import { CourseCard } from "@/features/courses/course-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { apiFetch } from "@/lib/api";
import type { Course, CourseCategory } from "@/types";
import { cn } from "@/lib/utils";

export function CourseCatalog({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    apiFetch<{ data: CourseCategory[] }>("/lms/categories", { auth: false })
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return courses.filter((c) => {
      const hay = `${c.title} ${c.shortDescription || ""} ${c.description || ""}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);
      const matchesCategory =
        category === "all" ||
        c.category?.slug === category ||
        String(c.category?.id) === category;
      return matchesQuery && matchesCategory;
    });
  }, [courses, debounced, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search courses…"
          className="max-w-md"
        />
      </div>
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={category === "all" ? "default" : "outline"}
            onClick={() => setCategory("all")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={String(cat.id)}
              size="sm"
              variant={category === cat.slug ? "default" : "outline"}
              className={cn(category === cat.slug && "pointer-events-none")}
              onClick={() => setCategory(cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Try a different search term or category."
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
