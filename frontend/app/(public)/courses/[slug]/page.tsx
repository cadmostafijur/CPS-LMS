import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollButton } from "@/features/courses/enroll-button";
import {
  getCourseBySlug,
  getMyCourses,
} from "@/services/courses.service";
import { getCurrentUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getSiteUrl } from "@/lib/config";
import { isStudent } from "@/lib/roles";

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
  const student = isStudent(user);
  let enrolled = false;
  if (user && token && student) {
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
  const firstPreview = lessons.find((l) => l.isPreview);
  const firstLessonId =
    firstPreview?.documentId ||
    firstPreview?.id ||
    lessons[0]?.documentId ||
    lessons[0]?.id;
  const courseKey = course.documentId || course.id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <Badge variant="gold" className="mb-3">
              {course.status}
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
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
              <h2 className="font-display text-xl font-semibold text-navy">
                Curriculum
              </h2>
              {course.requirements ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Requirements: </span>
                  {course.requirements}
                </p>
              ) : null}
              {course.outcomes ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Outcomes: </span>
                  {course.outcomes}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2">
                {lessons.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    Lessons coming soon.
                  </li>
                ) : (
                  lessons.map((lesson, index) => {
                    const preview = lesson.isPreview;
                    const lessonKey = lesson.documentId || lesson.id;
                    return (
                      <li
                        key={String(lessonKey)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm"
                      >
                        <div>
                          <span className="mr-2 text-muted-foreground">
                            {index + 1}.
                          </span>
                          {lesson.title}
                          {lesson.module?.title ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {lesson.module.title}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {preview ? <Badge variant="gold">Preview</Badge> : null}
                          {preview && user ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/learn/${courseKey}/${lessonKey}`}>
                                Preview
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
          <Card className="h-fit rounded-2xl border-border/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-navy">Get started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {course.category?.name ? (
                  <Badge variant="secondary">{course.category.name}</Badge>
                ) : null}
                {course.difficulty ? (
                  <Badge variant="outline">{course.difficulty}</Badge>
                ) : null}
                {course.language ? (
                  <Badge variant="outline">{course.language}</Badge>
                ) : null}
              </div>
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
                isFree={course.isFree !== false && !(Number(course.price) > 0)}
                price={Number(course.discountPrice ?? course.price ?? 0)}
                currency={course.currency || "USD"}
                canEnroll={student}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
