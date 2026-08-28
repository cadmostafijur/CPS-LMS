import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types";
import { cn } from "@/lib/utils";

export function CourseCard({ course, className }: { course: Course; className?: string }) {
  const lessonCount = course.lessonCount ?? course.lessons?.length ?? 0;
  const quizCount = course.quizCount ?? course.quizzes?.length ?? 0;
  const isPaid = course.isFree === false && Number(course.price) > 0;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange/25 hover:shadow-lg",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/15 via-white to-navy/5">
            <BookOpen className="h-10 w-10 text-orange/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <Badge
          className="absolute left-3 top-3 shadow-sm"
          variant={isPaid ? "gold" : "success"}
        >
          {isPaid
            ? `${course.currency || "USD"} ${Number(course.price).toFixed(0)}`
            : "Free"}
        </Badge>
        {course.difficulty ? (
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 bg-white/90 text-navy shadow-sm"
          >
            {String(course.difficulty).charAt(0) +
              String(course.difficulty).slice(1).toLowerCase()}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {course.category?.name ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-orange">
            {course.category.name}
          </p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 font-display text-lg font-semibold leading-snug text-navy">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {course.shortDescription || course.description || "Structured lessons with hands-on practice."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            {lessonCount} lessons
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">
            <Clapperboard className="h-3 w-3" />
            {quizCount} quizzes
          </span>
          {course.instructor?.name ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              {course.instructor.name}
            </span>
          ) : null}
        </div>

        <Button asChild className="mt-5 w-full rounded-xl">
          <Link href={`/courses/${course.slug}`}>
            View course
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
