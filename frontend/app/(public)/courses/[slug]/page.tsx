import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { EnrollButton } from "@/features/courses/enroll-button";
import {
  CourseDiscussions,
  type DiscussionThread,
} from "@/features/courses/course-discussions";
import { CourseReviewsPanel } from "@/features/courses/course-reviews-panel";
import { WishlistButton } from "@/features/courses/wishlist-button";
import {
  getCourseBySlug,
  getCourseProgress,
  getMyCourses,
} from "@/services/courses.service";
import { getCurrentUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getSiteUrl } from "@/lib/config";
import { continueLessonHref } from "@/lib/continue-lesson";
import { apiFetch } from "@/lib/api";
import { isAdmin, isContentManager, isInstructor, isStudent } from "@/lib/roles";
import { BookOpen } from "lucide-react";

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
  let continueHref: string | null = null;

  const lessons = [...(course.lessons || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const modules = [...(course.modules || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const courseKey = course.documentId || course.id;

  if (user && token && student) {
    const mine = await getMyCourses(token).catch(() => null);
    enrolled = Boolean(
      mine?.data?.some(
        (e) =>
          String(e.course?.id) === String(course.id) ||
          String(e.course?.documentId) === String(course.documentId)
      )
    );
    if (enrolled) {
      const progress = await getCourseProgress(courseKey, token).catch(() => null);
      const completedIds = (progress?.data?.lessons || [])
        .filter((lp) => lp.completed)
        .map((lp) => lp.lesson?.documentId || lp.lesson?.id)
        .filter((id): id is string | number => id != null);
      continueHref = continueLessonHref(
        courseKey,
        lessons,
        completedIds,
        progress?.data?.moduleGates || course.moduleGates
      );
    }
  }

  const staff =
    isAdmin(user) || isContentManager(user) || isInstructor(user);
  const canDiscuss = Boolean(enrolled || staff);
  let threads: DiscussionThread[] = [];
  let reviews: any[] = [];
  let wishlisted = false;
  let liveSessions: any[] = [];
  let announcements: any[] = [];

  try {
    const rev = await apiFetch<{ data: any[] }>(
      `/lms/courses/${courseKey}/reviews`
    );
    reviews = rev.data || [];
  } catch {
    reviews = [];
  }

  if (user && token && student) {
    try {
      const wish = await apiFetch<{ data: any[] }>("/lms/wishlist", { token });
      wishlisted = Boolean(
        (wish.data || []).some(
          (w) =>
            String(w.course?.id) === String(course.id) ||
            String(w.course?.documentId) === String(course.documentId)
        )
      );
    } catch {
      wishlisted = false;
    }
  }

  if (user && token && canDiscuss) {
    try {
      const res = await apiFetch<{ data: DiscussionThread[] }>(
        `/lms/courses/${courseKey}/discussions`,
        { token }
      );
      threads = res.data || [];
    } catch {
      threads = [];
    }
    try {
      const live = await apiFetch<{ data: any[] }>(
        `/lms/courses/${courseKey}/live-sessions`,
        { token }
      );
      liveSessions = live.data || [];
    } catch {
      liveSessions = [];
    }
    try {
      const ann = await apiFetch<{ data: any[] }>(
        `/lms/courses/${courseKey}/announcements`,
        { token }
      );
      announcements = ann.data || [];
    } catch {
      announcements = [];
    }
  }

  const firstPreview = lessons.find((l) => l.isPreview);
  const firstLessonId =
    firstPreview?.documentId ||
    firstPreview?.id ||
    lessons[0]?.documentId ||
    lessons[0]?.id;

  const enrollBlock = (
    <EnrollButton
      courseId={courseKey}
      enrolled={enrolled}
      firstLessonId={firstLessonId}
      continueHref={continueHref}
      isFree={course.isFree !== false && !(Number(course.price) > 0)}
      price={Number(course.discountPrice ?? course.price ?? 0)}
      currency={course.currency || "USD"}
      canEnroll={!user || student}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-10 pb-28 lg:py-12 lg:pb-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
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

              {modules.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {modules.map((mod) => {
                    const modLessons = lessons.filter(
                      (l) =>
                        String(l.module?.documentId || l.module?.id) ===
                        String(mod.documentId || mod.id)
                    );
                    return (
                      <div key={String(mod.documentId || mod.id)}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {mod.title}
                        </p>
                        <ul className="space-y-2">
                          {modLessons.map((lesson, index) => {
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
                                </div>
                                <div className="flex items-center gap-2">
                                  {preview ? (
                                    <Badge variant="gold">Preview</Badge>
                                  ) : null}
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
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : lessons.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  icon={BookOpen}
                  title="Curriculum coming soon"
                  description="Lessons and modules will appear here once the instructor publishes them."
                />
              ) : (
                <ul className="mt-4 space-y-2">
                  {lessons.map((lesson, index) => {
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
                  })}
                </ul>
              )}
            </div>
            {canDiscuss ? (
              <CourseDiscussions
                courseId={courseKey}
                canPost={canDiscuss}
                initialThreads={threads}
              />
            ) : (
              <section id="discussions" className="mt-10 scroll-mt-24">
                <h2 className="font-display text-xl font-semibold text-navy">
                  Course discussion
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enroll as a student to ask questions and join the Q&amp;A.
                </p>
              </section>
            )}

            {announcements.length > 0 ? (
              <section id="announcements" className="mt-10 scroll-mt-24">
                <h2 className="font-display text-xl font-semibold text-navy">
                  Announcements
                </h2>
                <ul className="mt-4 space-y-3">
                  {announcements.map((a) => (
                    <li
                      key={String(a.documentId || a.id)}
                      className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
                    >
                      <p className="font-semibold text-navy">{a.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {a.content}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {liveSessions.length > 0 ? (
              <section id="live" className="mt-10 scroll-mt-24">
                <h2 className="font-display text-xl font-semibold text-navy">
                  Live classes
                </h2>
                <ul className="mt-4 space-y-3">
                  {liveSessions.map((s) => (
                    <li
                      key={String(s.documentId || s.id)}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-navy">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.startsAt
                            ? new Date(s.startsAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                      <Button asChild size="sm">
                        <a href={s.meetingUrl} target="_blank" rel="noreferrer">
                          Join
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <CourseReviewsPanel
              courseId={courseKey}
              canReview={Boolean(enrolled && student)}
              initialReviews={reviews}
            />
          </div>

          <Card className="hidden h-fit rounded-2xl border-border/80 bg-white shadow-sm lg:block lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="font-display text-navy">Get started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lessons.length} lessons
                {modules.length ? ` · ${modules.length} modules` : ""}
                {course.instructor?.name
                  ? ` · Instructor: ${course.instructor.name}`
                  : ""}
              </p>
              {student && user ? (
                <WishlistButton courseId={courseKey} initialSaved={wishlisted} />
              ) : null}
              {enrollBlock}
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto max-w-6xl">{enrollBlock}</div>
      </div>

      <Footer />
    </div>
  );
}
