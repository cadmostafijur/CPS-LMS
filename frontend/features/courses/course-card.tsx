import Link from "next/link";
import { BookOpen } from "lucide-react";
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
  const lessonCount = course.lessons?.length ?? 0;
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-navy to-navy-2">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-10 w-10 text-gold" />
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{course.title}</CardTitle>
          <Badge variant="gold">{course.status}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {course.shortDescription || course.description || "No description yet."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto text-xs text-muted-foreground">
        {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
        {course.instructor?.name ? ` · ${course.instructor.name}` : ""}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/courses/${course.slug}`}>View course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
