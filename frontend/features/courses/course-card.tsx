import Link from "next/link";
import { BookOpen, Clapperboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types";

export function CourseCard({ course }: { course: Course }) {
  const lessonCount = course.lessonCount ?? course.lessons?.length ?? 0;
  const quizCount = course.quizCount ?? course.quizzes?.length ?? 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 overflow-hidden bg-surface">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/10 to-navy/5">
            <BookOpen className="h-10 w-10 text-orange" />
          </div>
        )}
        <Badge className="absolute left-3 top-3" variant="gold">
          {course.status}
        </Badge>
      </div>
      <CardHeader className="space-y-2">
        <CardTitle className="line-clamp-2 font-display text-lg leading-snug text-navy">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {course.shortDescription || course.description || "No description yet."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {lessonCount} lessons
        </span>
        <span className="inline-flex items-center gap-1">
          <Clapperboard className="h-3.5 w-3.5" />
          {quizCount} quiz{quizCount === 1 ? "" : "zes"}
        </span>
        {course.instructor?.name ? (
          <span className="truncate">by {course.instructor.name}</span>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/courses/${course.slug}`}>View course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
