import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollButton } from "@/features/courses/enroll-button";
import {
  getCourseBySlug,
  getMyCourses,
} from "@/services/courses.service";
import { getCurrentUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getSiteUrl } from "@/lib/config";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) return { title: "Course" };
  return {
    title: course.title,
    description: course.shortDescription || course.description || undefined,
    openGraph: {
      title: course.title,
      description: course.shortDescription || undefined,
      url: `${getSiteUrl()}/courses/${course.slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  const user = await getCurrentUser();
  const token = await getTokenFromCookies();
  let enrolled = false;
  if (user && token) {
    const mine = await getMyCourses(token).catch(() => null);
    enrolled = Boolean(
      mine?.data?.some(
        (e) =>
          String(e.course?.id) === String(course.id) ||
          String(e.course?.documentId) === String(course.documentId)
      )
    );
  }

  const lessons = [...(course.lessons || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const firstLessonId = lessons[0]?.documentId || lessons[0]?.id;
  const courseKey = course.documentId || course.id;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <Badge variant="gold" className="mb-3">
              {course.status}
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {course.shortDescription || course.description}
            </p>
            {course.description && course.shortDescription ? (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {course.description}
              </p>
            ) : null}
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold">Curriculum</h2>
              <ul className="mt-4 space-y-2">
                {lessons.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    Lessons coming soon.
                  </li>
                ) : (
                  lessons.map((lesson, index) => (
                    <li
                      key={String(lesson.documentId || lesson.id)}
                      className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      <span className="mr-2 text-muted-foreground">
                        {index + 1}.
                      </span>
                      {lesson.title}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Get started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lessons.length} lessons
                {course.instructor?.name
                  ? ` · Instructor: ${course.instructor.name}`
                  : ""}
              </p>
              <EnrollButton
                courseId={courseKey}
                enrolled={enrolled}
                firstLessonId={firstLessonId}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
