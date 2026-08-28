import type { Course, CourseStatus } from "@/types";

export type StaffCourseItem = {
  id: string;
  title: string;
  status: CourseStatus | string;
  lessonCount: number;
  quizCount?: number;
  thumbnailUrl?: string | null;
  shortDescription?: string | null;
  difficulty?: string | null;
  isFree?: boolean;
  instructorName?: string | null;
  categoryName?: string | null;
  editHref: string;
};

export function coursesToStaffItems(
  courses: Course[],
  editBase: string
): StaffCourseItem[] {
  if (!Array.isArray(courses)) return [];

  return courses
    .filter((course) => course && (course.documentId || course.id))
    .map((course) => {
      const id = String(course.documentId || course.id);
      const difficulty =
        typeof course.difficulty === "string" ? course.difficulty : null;

      return {
        id,
        title: course.title?.trim() || "Untitled course",
        status: course.status || "DRAFT",
        lessonCount: course.lessonCount ?? course.lessons?.length ?? 0,
        quizCount: course.quizCount ?? course.quizzes?.length ?? 0,
        thumbnailUrl: course.thumbnailUrl,
        shortDescription: course.shortDescription || course.description,
        difficulty,
        isFree: course.isFree !== false && !(Number(course.price) > 0),
        instructorName: course.instructor?.name ?? null,
        categoryName: course.category?.name ?? null,
        editHref: `${editBase}/${id}/edit`,
      };
    });
}
