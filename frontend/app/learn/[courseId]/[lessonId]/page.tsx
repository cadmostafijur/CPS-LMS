import { notFound } from "next/navigation";
import { LearningPlayer } from "@/features/learn/learning-player";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import {
  getCourseById,
  getCourseProgress,
} from "@/services/courses.service";

type Props = { params: Promise<{ courseId: string; lessonId: string }> };

export default async function LearnPage({ params }: Props) {
  const { courseId, lessonId } = await params;
  await requireUser(`/learn/${courseId}/${lessonId}`);
  const token = await getTokenFromCookies();

  const course = await getCourseById(courseId, token).catch(() => null);
  if (!course) notFound();

  const lesson = (course.lessons || []).find(
    (l) =>
      String(l.documentId) === String(lessonId) ||
      String(l.id) === String(lessonId)
  );
  if (!lesson) notFound();

  const progress = await getCourseProgress(
    course.documentId || course.id,
    token
  ).catch(() => null);

  const completedLessonIds = (progress?.data.lessons || [])
    .filter((lp) => lp.completed)
    .map((lp) => lp.lesson?.documentId || lp.lesson?.id)
    .filter((id): id is string | number => id != null);

  return (
    <LearningPlayer
      course={course}
      lesson={lesson}
      completedLessonIds={completedLessonIds}
      progressPercent={progress?.data.percentage ?? 0}
    />
  );
}
