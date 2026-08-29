"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList, Layers, LayoutList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseForm } from "@/features/courses/course-form";
import { LessonManager } from "@/features/courses/lesson-manager";
import { ModuleManager } from "@/features/courses/module-manager";
import { QuizManager } from "@/features/courses/quiz-manager";
import type { Course } from "@/types";

function statusVariant(status?: string) {
  const value = String(status || "DRAFT").toUpperCase();
  if (value === "PUBLISHED") return "success" as const;
  if (value === "ARCHIVED") return "outline" as const;
  return "gold" as const;
}

export function CourseEditWorkspace({
  course,
  redirectBase,
  extras,
}: {
  course: Course;
  redirectBase: string;
  extras?: React.ReactNode;
}) {
  const courseKey = course.documentId || course.id;
  const modules = course.modules || [];
  const lessons = course.lessons || [];
  const quizzes = course.quizzes || [];
  const isDraft = String(course.status || "DRAFT").toUpperCase() !== "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-r from-orange/10 via-white to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange/15 text-orange">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-display text-xl font-bold text-navy">
                {course.title || "Untitled course"}
              </h2>
              <Badge variant={statusVariant(course.status)}>{course.status || "DRAFT"}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {modules.length} modules · {lessons.length} lessons · {quizzes.length} quizzes
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={redirectBase}>
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>
        </Button>
      </div>

      {isDraft ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This course is a <strong>draft</strong>. It will appear in your courses list, but students
          will not see it in the public catalog until you set status to <strong>Published</strong>.
        </p>
      ) : null}

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-surface p-1 sm:grid-cols-4">
          <TabsTrigger value="details" className="gap-2 py-2.5">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">Details</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2 py-2.5">
            <LayoutList className="h-4 w-4 shrink-0" />
            <span className="truncate">Modules ({modules.length})</span>
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2 py-2.5">
            <Layers className="h-4 w-4 shrink-0" />
            <span className="truncate">Lessons ({lessons.length})</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2 py-2.5">
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span className="truncate">Quizzes ({quizzes.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0 max-w-4xl">
          <CourseForm course={course} redirectBase={redirectBase} hideHeader />
        </TabsContent>

        <TabsContent value="modules" className="mt-0 max-w-3xl">
          <ModuleManager courseId={courseKey} modules={modules} />
        </TabsContent>

        <TabsContent value="lessons" className="mt-0 max-w-3xl">
          <LessonManager
            courseId={courseKey}
            lessons={lessons}
            modules={modules}
          />
        </TabsContent>

        <TabsContent value="quizzes" className="mt-0 max-w-3xl">
          <QuizManager
            courseId={courseKey}
            quizzes={quizzes}
            modules={modules}
          />
        </TabsContent>
      </Tabs>

      {extras ? <div className="max-w-4xl">{extras}</div> : null}
    </div>
  );
}
